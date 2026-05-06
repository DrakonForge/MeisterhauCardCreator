import puppeteer from "puppeteer";
import { readAndValidateFiles } from "./validation/parseFiles";
import * as path from "path";
import * as fs from "fs";
import { clearFolder, createProgressBar, ensureOutputDirExists, main } from "./util/cliUtil";
import { consola } from "consola";
import type { Card } from "./types/card";
import { delay } from "./util/delay";
import { readDeckList, type DeckListEntry } from "./util/decklist";

const CONCURRENT_TASK_LIMIT = 5;

let shouldExitEarly = false;

let allProcessed = 0;

const processCardsParallelChunked = async (cardList: Record<string, Card>, outputDir: string, siteUrl: string, taskLimit: number): Promise<void> => {
    consola.log("Running chunked parallel task.");
    const cardEntries = Object.entries(cardList);
    const cardIds = Object.keys(cardList);
    const numChunks = taskLimit;
    const chunkSize = Math.ceil(cardEntries.length / numChunks);
    const tasks = [];
    const executing = new Set<Promise<boolean | void>>();

    consola.log(`Started ${cardEntries.length} tasks...`);
    consola.log(`Using chunk size of ${chunkSize} across ${numChunks} chunks`);

    let numFails = 0;

    const updateProgress = (success: boolean) => {
        if (!success) {
            numFails++;
            shouldExitEarly = true;
        }
    }

    for (let i = 0; i < numChunks; ++i) {
        const chunk = cardIds.slice(i * chunkSize, Math.min((i + 1) * chunkSize, cardEntries.length));
        consola.debug(`${chunk.length} cards in chunk ${i + 1}`);
        const task = processParallelChunk(cardList, chunk, outputDir, siteUrl).then(t => {
            updateProgress(t);
            executing.delete(task);
            return t;
        }).catch((e) => {
            consola.error(`Failed to process chunk ${i}:`, e);
            updateProgress(false);
        });
        tasks.push(task);
    }

    let lastAllProcessed = -1;
    const progressBarPoll = setInterval(() => {
        if (allProcessed > lastAllProcessed) {
            consola.log(`Progress: ${createProgressBar(allProcessed / cardEntries.length, 10)} (${allProcessed}/${cardEntries.length})`);
            lastAllProcessed = allProcessed;
        }
    }, 100);
    await Promise.allSettled(tasks);
    clearInterval(progressBarPoll);
    if (numFails) {
        consola.error(`Processing completed with failures. Failed to generate ${numFails} images out of ${cardEntries.length} total.`);
    } else {
        consola.success(`Processing completed successfully. Generated ${cardEntries.length} images.`);
    }
}

const processParallelChunk = async (cardList: Record<string, Card>, cardIds: string[], outputDir: string, siteUrl: string): Promise<boolean> => {
    // consola.log("Running parallel chunk task.");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const response = await page.goto(siteUrl);

    // consola.log(`Connected to ${siteUrl}. Request status: ${response?.status()}`);

    const updateButton = await page.$('button.update-button');
    const displayImg = await page.$('.card-display-output > img');
    let numFails = 0;
    let index = 0;

    for (const key of cardIds) {
        if (shouldExitEarly) {
            break;
        }
        const card = cardList[key];
        consola.debug(`Received ${key} at index ${index++}`);
        const text = JSON.stringify(card);
        await page.evaluate((text) => {
            const textarea = document.querySelector<HTMLTextAreaElement>("textarea.json-entry");
            if (textarea != null) {
                textarea.value = text;
            } else {
                (window as any).status = "fail";
                (window as any).errorMessage = "No textarea found";
            }
        }, text);
        // Need to call it twice due to rendering bugs
        await updateButton?.click();
        await delay(50);
        await updateButton?.click();

        // Wait for process to finish
        try {
            await page.waitForFunction('window.status === "ready" || window.status === "fail"', {
                polling: 100,
                timeout: 30000,
            });
        } catch {
            // Don't error on timeout, let it be caught in the status later
        }

        const status = await page.evaluate("window.status");
        if (status !== "ready") {
            const errorMessage = await page.evaluate("window.errorMessage");
            consola.error(`Failed to render image for ${key} with status ${status}, error: ${errorMessage}`);
            numFails++;
            break;
        }

        const url = await displayImg?.evaluate(img => img.src);
        if (url) {
            consola.debug(`Processing ${key} - ${url.length}`);
            const imgPage = await browser.newPage();
            const viewSource = await imgPage.goto(url);
            const filePath = path.join(outputDir, key + ".png");
            consola.debug(`Writing image to ${filePath}`);
            fs.writeFileSync(filePath, await viewSource?.buffer()!);
            await imgPage.close();
            allProcessed += 1;
        } else {
            consola.error(`Failed to find image for ${key}`);
            numFails++;
            break;  // Exit early
        }
    }

    // consola.log("Cleaning up...");
    await browser.close();
    if (numFails) {
        consola.error(`Processing completed with failures. Failed to generate ${numFails} images out of ${cardIds.length} in the chunk.`);
        throw new Error(`Processing completed with failures. Failed to generate ${numFails} images out of ${cardIds.length} in the chunk.`)
    }
    // consola.success(`Processing completed successfully. Generated all ${cardIds.length} images in the chunk.`);
    return true;
}

const processCardsParallel = async (cardList: Record<string, Card>, outputDir: string, siteUrl: string, taskLimit: number): Promise<void> => {
    consola.log("Running parallel task.");
    const cardEntries = Object.entries(cardList);
    const tasks = [];
    const executing = new Set<Promise<boolean | void>>();

    consola.log(`Started ${cardEntries.length} tasks...`);
    consola.log(`Progress: ${createProgressBar(0, 10)} (0/${cardEntries.length})`);

    let numProcessed = 0;
    let numFails = 0;

    const updateProgress = (success: boolean) => {
        numProcessed++;
        if (!success) {
            numFails++;
            shouldExitEarly = true;
        }
        consola.log(`Progress: ${createProgressBar(numProcessed / cardEntries.length, 10)} (${numProcessed}/${cardEntries.length})`);
    }

    for (const [key, card] of cardEntries) {
        if (shouldExitEarly) {
            break;
        }
        const task = processCardParallel(key, card, outputDir, siteUrl).then(t => {
            updateProgress(t);
            executing.delete(task);
            return t;
        }).catch((e) => {
            consola.error(`Failed to process image ${key}:`, e);
            updateProgress(false);
        });

        tasks.push(task);
        executing.add(task);

        if (executing.size >= taskLimit) {
            await Promise.race(executing);
        }
    }

    await Promise.allSettled(tasks);
    if (numFails) {
        consola.error(`Processing completed with failures. Failed to generate ${numFails} images out of ${cardEntries.length} total.`);
    } else {
        consola.success(`Processing completed successfully. Generated ${cardEntries.length} images.`);
    }
}

const processCardParallel = async (key: string, card: Card, outputDir: string, siteUrl: string): Promise<boolean> => {
    const browser = await puppeteer.launch({
        // browser: "firefox"
    });

    try {
        const page = await browser.newPage();
        const response = await page.goto(siteUrl);

        consola.debug(`Connected to ${siteUrl}. Request status: ${response?.status()}`);
        consola.debug(`Starting task for ${card.Name}`);

        const updateButton = await page.$('button.update-button');
        const displayImg = await page.$('.card-display-output > img');

        // Should be a fresh window, so no need to clear
        const text = JSON.stringify(card);
        await page.evaluate((text) => {
            const textarea = document.querySelector<HTMLTextAreaElement>("textarea.json-entry");
            if (textarea != null) {
                textarea.value = text;
            } else {
                (window as any).status = "fail";
                (window as any).errorMessage = "No textarea found";
            }
        }, text);
        // Need to call it twice due to rendering bugs
        await updateButton?.click();
        await delay(50);
        await updateButton?.click();

        // Wait for process to finish
        await page.waitForFunction('window.status === "ready" || window.status === "fail"', {
            polling: 100,
            timeout: 15000,
        });
        const status = await page.evaluate("window.status");
        if (status !== "ready") {
            const errorMessage = await page.evaluate("window.errorMessage");
            throw new Error(`Failed to render image for ${key}, error: ${errorMessage}`);
        }

        const url = await displayImg?.evaluate(img => img.src);
        if (url) {
            consola.debug(`Processing ${key} - ${url.length}`);
            const viewSource = await page.goto(url);
            const filePath = path.join(outputDir, key + ".png");
            consola.debug(`Writing image to ${filePath}`);
            fs.writeFileSync(filePath, await viewSource?.buffer()!);
        } else {
            consola.error(`Failed to find image for ${key}`);
        }

        await browser.close();
        return !!url;
    } catch (e) {
        consola.error(`Failed to process image ${key}:`, e);
        await browser.close();
        return false;
    }
}

const processCardsSequential = async (cardList: Record<string, Card>, outputDir: string, siteUrl: string): Promise<void> => {
    consola.log("Running synchronous task.");
    const debugMode = false;
    const browser = await puppeteer.launch({
        // browser: "firefox",
        headless: !debugMode,
    });
    const page = await browser.newPage();
    const response = await page.goto(siteUrl);
    const cardEntries = Object.entries(cardList);

    consola.log(`Connected to ${siteUrl}. Request status: ${response?.status()}`);
    consola.log(`Progress: ${createProgressBar(0, 10)} (0/${cardEntries.length})`);

    const updateButton = await page.$('button.update-button');
    const displayImg = await page.$('.card-display-output > img');
    let numProcessed = 0;
    let numFails = 0;

    for (const [key, card] of cardEntries) {
        numProcessed++;
        consola.log(`Progress: ${createProgressBar(numProcessed / cardEntries.length, 10)} (${numProcessed}/${cardEntries.length})`);
        consola.debug(`Received ${key}`);
        const text = JSON.stringify(card);
        await page.evaluate((text) => {
            const textarea = document.querySelector<HTMLTextAreaElement>("textarea.json-entry");
            if (textarea != null) {
                textarea.value = text;
            } else {
                (window as any).status = "fail";
                (window as any).errorMessage = "No textarea found";
            }
        }, text);
        // Need to call it twice due to rendering bugs
        await updateButton?.click();
        await delay(50);
        await updateButton?.click();

        // Wait for process to finish
        await page.waitForFunction('window.status === "ready" || window.status === "fail"', {
            polling: 500,
            timeout: 15000,
        });
        const status = await page.evaluate("window.status");
        if (status !== "ready") {
            const errorMessage = await page.evaluate("window.errorMessage");
            consola.error(`Failed to render image for ${key}, error: ${errorMessage}`);
            numFails++;
            continue;
        }

        const url = await displayImg?.evaluate(img => img.src);
        if (url) {
            consola.debug(`Processing ${key} - ${url.length}`);
            const imgPage = await browser.newPage();
            const viewSource = await imgPage.goto(url);
            const filePath = path.join(outputDir, key + ".png");
            consola.debug(`Writing image to ${filePath}`);
            fs.writeFileSync(filePath, await viewSource?.buffer()!);
            if (!debugMode) {
                await imgPage.close();
            }
        } else {
            consola.error(`Failed to find image for ${key}`);
            numFails++;
            break;  // Exit early
        }
    }

    consola.log("Cleaning up...");
    if (!debugMode) {
        await browser.close();
    }
    if (numFails) {
        consola.error(`Processing completed with failures. Failed to generate ${numFails} images out of ${cardEntries.length} total.`);
    } else {
        consola.success(`Processing completed successfully. Generated ${cardEntries.length} images.`);
    }
}

const removeImages = async (removePath: string, outputDir: string): Promise<void> => {
    const toRemoveArr: DeckListEntry[] = await readDeckList(removePath);
    const toRemove: string[] = toRemoveArr.map(entry => entry.cardId);

    if (toRemove.length) {
        let numRemoved = 0;
        for (const cardIdToRemove of toRemove) {
            consola.debug(`Removing ${cardIdToRemove}`);
            const pathToCard = path.join(outputDir, `${cardIdToRemove}.png`);
            if (fs.existsSync(pathToCard)) {
                fs.unlinkSync(pathToCard);
                numRemoved += 1;
            }
        }
        consola.log(`Removed ${numRemoved} old images`);
    }
}

const filterToDeck = (cardList: Record<string, Card>, deckList: DeckListEntry[]) => {
    const cardsToInclude = new Set(deckList.map(entry => entry.cardId));
    for (const cardId of Object.keys(cardList)) {
        if (!cardsToInclude.has(cardId)) {
            delete cardList[cardId];
        }
    }
}

const DEFAULT_DIFF = "./generated/tracked_changes/AddedOrUpdated.txt";
const DEFAULT_ALL = "./generated/decklists/Deck_All.txt";
const generateImages = async (inputDir: string, outputDir: string, deckPath: string, removePath: string, siteUrl: string, recursive: boolean, sync: boolean, chunked: boolean, diff: boolean, all: boolean, taskLimit: number) => {
    ensureOutputDirExists(outputDir);
    const cardList = await readAndValidateFiles(inputDir, recursive);
    if (diff) {
        consola.log("Diff mode is enabled. Old images will be removed and only new ones will be updated.")
        await removeImages(removePath, outputDir);
        deckPath = deckPath || DEFAULT_DIFF;
    } else {
        clearFolder(outputDir, recursive, ".png");
        deckPath = DEFAULT_ALL;
    }

    if (!all) {
        consola.log(`Filtering to deck at ${deckPath}`);
        if (!fs.existsSync(deckPath)) {
            consola.warn("No decklist found. Are you sure you ran \"npm run decklist\"?");
        }
        const deckList = await readDeckList(deckPath);
        filterToDeck(cardList, deckList);
        if (!deckList.length) {
            consola.warn("No cards in provided decklist. Are you sure the one you're using is correct?")
        }
    }

    if (!Object.keys(cardList).length) {
        // No data to process
        return;
    }

    if (sync) {
        await processCardsSequential(cardList, outputDir, siteUrl);
    } else if (chunked) {
        await processCardsParallelChunked(cardList, outputDir, siteUrl, taskLimit);
    } else {
        await processCardsParallel(cardList, outputDir, siteUrl, taskLimit);
    }
};

await main(async args => {
    const inputDir = args['input'] ?? "./generated/card_data";
    const outputDir = args['output'] ?? "./generated/card_images";
    const deckPath = args['deck'] ?? "";
    const removePath = args['remove'] ?? "./generated/tracked_changes/Removed.txt";
    const siteUrl = args['site'] ?? "http://localhost:3000/";
    const recursive = args['r'] ?? false;
    const sync = args['sync'] ?? false;
    const chunked = args['chunked'] ?? false;
    const taskLimit = args['chunk'] ?? CONCURRENT_TASK_LIMIT;
    const diff = args['diff'] ?? false;
    const all = args['all'] ?? false;
    await generateImages(inputDir, outputDir, deckPath, removePath, siteUrl, recursive, sync, chunked, diff, all, taskLimit);
});
