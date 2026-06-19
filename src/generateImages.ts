import puppeteer from "puppeteer";
import { readAndValidateFiles } from "./validation/parseFiles";
import * as path from "path";
import * as fs from "fs";
import { clearFolder, createProgressBar, ensureOutputDirExists, main } from "./util/cliUtil";
import { consola } from "consola";
import type { Card } from "./types/card";
import { delay } from "./util/delay";
import { generateDeckList, readDeckList, type DeckListEntry } from "./util/decklist";

let totalProcessed = 0;
let totalSuccess = 0;
let totalError = 0;

interface ImageEntry {
    id: string;
    card: Card;
}

const processCards = async (cardEntries: ImageEntry[], outputDir: string, siteUrl: string, threadLimit: number, pageSize: number): Promise<ImageEntry[]> => {
    consola.log("Processing cards.");
    totalProcessed = 0;
    totalSuccess = 0;
    totalError = 0;

    const numCards = cardEntries.length;

    if (numCards <= 0) {
        consola.log("No cards to process, exiting.");
        return [];
    }

    // Break cardList into pages
    const pages = divideCardsIntoPages(cardEntries, pageSize);
    const numPages = pages.length;
    const threadsToUse = Math.min(threadLimit, numPages);

    consola.log(`Starting ${threadsToUse} thread(s) to process ${numPages} page(s) of ${numCards} cards`);

    let lastAllProcessed = -1;
    const progressBarPoll = setInterval(() => {
        if (totalProcessed > lastAllProcessed) {
            consola.log(`Progress: ${createProgressBar(totalProcessed / numCards, 10)} (${totalProcessed}/${numCards})`);
            lastAllProcessed = totalProcessed;
        }
    }, 100);

    const threadPool: Promise<void>[] = [];
    const needToRetry: ImageEntry[] = [];
    for (const page of pages) {
        const taskPromise = processPage(page, outputDir, siteUrl, needToRetry).finally(() => {
            const index = threadPool.indexOf(taskPromise);
            if (index > -1) {
                threadPool.splice(index, 1);
            }
        });
        threadPool.push(taskPromise);
        if (threadPool.length >= threadsToUse) {
            await Promise.race(threadPool);
        }
    }

    await Promise.all(threadPool);
    clearInterval(progressBarPoll);

    if (needToRetry.length) {
        consola.error(`Processing completed with failures. Failed to generate ${totalError} images out of ${numCards} total.`);
        consola.info(`Failed images: ${needToRetry.map(item => item.id).join(", ")}`);
    } else {
        consola.success(`Processing completed successfully. Generated ${numCards} images (${totalSuccess} successful, ${totalError} failed, ${totalProcessed} processed).`);
    }
    return needToRetry;
};

const processPage = async (images: ImageEntry[], outputDir: string, siteUrl: string, needToRetry: ImageEntry[]): Promise<void> => {
    // consola.log("Running parallel chunk task.");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const response = await page.goto(siteUrl);

    // consola.log(`Connected to ${siteUrl}. Request status: ${response?.status()}`);

    const updateButton = await page.$('button.update-button');
    const displayImg = await page.$('.card-display-output > img');
    let numFails = 0;
    let index = 0;

    for (const image of images) {
        const { id, card } = image;
        consola.debug(`Received ${id} at index ${index++}`);
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
        await delay(25);
        await updateButton?.click();
        await delay(25);

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
            consola.error(`Failed to render image for ${id} with status ${status}, error: ${errorMessage}`);
            needToRetry.push(image);
            numFails++;
            break;
        }

        const url = await displayImg?.evaluate(img => img.src);
        if (url) {
            consola.debug(`Processing ${id} - ${url.length}`);
            const imgPage = await browser.newPage();
            const viewSource = await imgPage.goto(url);
            const filePath = path.join(outputDir, id + ".png");
            consola.debug(`Writing image to ${filePath}`);
            fs.writeFileSync(filePath, await viewSource?.buffer()!);
            await imgPage.close();
            totalSuccess += 1;
        } else {
            consola.error(`Failed to find image for ${id}`);
            totalError += 1;
        }
        totalProcessed += 1;
    }

    await browser.close();
}

const divideCardsIntoPages = (cardEntries: ImageEntry[], pageSize: number): ImageEntry[][] => {
    const pages: ImageEntry[][] = [];
    const numPages = Math.ceil(cardEntries.length / pageSize);
    for (let i = 0; i < numPages; ++i) {
        const startIndex = i * pageSize;
        const endIndex = Math.min(cardEntries.length, (i + 1) * pageSize);
        const page: ImageEntry[] = cardEntries.slice(startIndex, endIndex);
        pages.push(page);
    }
    return pages;
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

const filterToDeck = (cardEntries: ImageEntry[], deckList: DeckListEntry[]) => {
    const cardsToInclude = new Set(deckList.map(entry => entry.cardId));
    const seenCards = new Set();
    for (let i = cardEntries.length - 1; i >= 0; --i) {
        const entry = cardEntries[i];
        if (!entry) {
            continue;
        }
        const cardId = entry.id;
        if (!cardsToInclude.has(cardId)) {
            cardEntries.splice(i, 1);
        }
        seenCards.add(cardId)
    }
    if (deckList.length > cardEntries.length) {
        consola.warn(`Unknown card IDs: ${Array.from(cardsToInclude.difference(seenCards)).join(", ")}`);
    }
}

const handleRetries = async (needToRetry: ImageEntry[], outputDir: string, siteUrl: string, taskLimit: number, pageSize: number): Promise<ImageEntry[]> => {
    let numRetries = 0;
    while (needToRetry.length) {
        if (numRetries >= MAX_RETRIES) {
            consola.error(`Ran out of retries (max ${MAX_RETRIES}). Writing results to file.`);
            return needToRetry;
        }
        needToRetry = await processCards(needToRetry, outputDir, siteUrl, taskLimit, pageSize);
        numRetries++;
    }
    return needToRetry;
};

const getCardEntries = async (inputDir: string, deckPath: string, recursive: boolean): Promise<ImageEntry[]> => {
    const cardList = await readAndValidateFiles(inputDir, recursive);
    const cardEntries: ImageEntry[] = Object.entries(cardList).map(([id, card]) => ({ id, card }));

    const deckList = await readDeckList(deckPath);
    filterToDeck(cardEntries, deckList);
    if (!deckList.length) {
        consola.warn("No cards in provided decklist. Are you sure the one you're using is correct?")
    }
    return cardEntries;
};

const saveRetries = async (needToRetry: ImageEntry[]) => {
    ensureOutputDirExists(RETRY_DIR);
    const deckEntries: DeckListEntry[] = needToRetry.map(item => ({cardId: item.id, quantity: 1}));
    await generateDeckList("NeedToRetry", deckEntries, RETRY_DIR);
}


const generateImages = async (inputDir: string, outputDir: string, deckPath: string, removePath: string, siteUrl: string, recursive: boolean, taskLimit: number, pageSize: number, oneshot: boolean, diffOnly: boolean) => {
    ensureOutputDirExists(outputDir);

    if (diffOnly) {
        consola.log("Diff mode is enabled. Old images will be removed and only new ones will be updated.")
        await removeImages(removePath, outputDir);
        deckPath = deckPath || DIFF_PATH;
    } else {
        clearFolder(outputDir, recursive, ".png");
    }
    consola.log(`Filtering to deck at ${deckPath}`);
    if (!fs.existsSync(deckPath)) {
        throw new Error(`No decklist found at ${deckPath}. If you did not specify a custom path, are you sure you ran "npm run decklist"?`);
    }

    const cardEntries = await getCardEntries(inputDir, deckPath, recursive);
    let needToRetry = await processCards(cardEntries, outputDir, siteUrl, taskLimit, pageSize);

    // Retry if needed
    if (needToRetry.length && !oneshot) {
        consola.log("Ran into some errors with processing. Attempting to retry...");
        needToRetry = await handleRetries(needToRetry, outputDir, siteUrl, taskLimit, pageSize);
    }

    if (needToRetry.length) {
        consola.log(`Ran into some errors with processing. Writing failed card IDs to ${RETRY_PATH}, you can rerun these using "npm run image -- --retry`);
        await saveRetries(needToRetry);
    }
};

const MAX_RETRIES = 1;
const DIFF_PATH = "./generated/tracked_changes/AddedOrUpdated.txt";
const ALL_CARDS_PATH = "./generated/decklists/Deck_All.txt";
const RETRY_PATH = "./generated/tracked_changes/NeedToRetry.txt";
const RETRY_DIR = "./generated/tracked_changes";
await main(async args => {
    const inputDir = args['input'] ?? "./generated/card_data";
    const outputDir = args['output'] ?? "./generated/card_images";
    const removePath = args['remove'] ?? "./generated/tracked_changes/Removed.txt";
    const siteUrl = args['site'] ?? "http://localhost:3000/";
    const recursive = args['r'] ?? false;
    const oneshot = args['oneshot'] ?? false; // Attempt to do it in one run, auto-retrying and exiting early if there are failures
    const taskLimit = args['chunk'] ?? 1;
    const pageSize = args['pagesize'] ?? 10;
    const diffOnly = args['diffonly'] ?? args['diff'] ?? false;
    const deckPath = args['all'] ? ALL_CARDS_PATH : args['diff'] ? DIFF_PATH : args['retry'] ? RETRY_PATH : args['deck'] ?? ALL_CARDS_PATH;
    await generateImages(inputDir, outputDir, deckPath, removePath, siteUrl, recursive, taskLimit, pageSize, oneshot, diffOnly);
});
