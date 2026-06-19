import puppeteer from "puppeteer";
import { readAndValidateFiles } from "./validation/parseFiles";
import * as path from "path";
import * as fs from "fs";
import { clearFolder, createProgressBar, ensureOutputDirExists, main } from "./util/cliUtil";
import { consola } from "consola";
import type { Card } from "./types/card";
import { delay } from "./util/delay";
import { readDeckList, type DeckListEntry } from "./util/decklist";

let shouldExitEarly = false; // TODO: Reimplement as an option?

let totalProcessed = 0;
let totalSuccess = 0;
let totalError = 0;

interface ImageEntry {
    id: string;
    card: Card;
}

const processCards = async (cardList: Record<string, Card>, outputDir: string, siteUrl: string, threadLimit: number, pageSize: number) => {
    consola.log("Processing cards.");
    totalProcessed = 0;

    // Break cardList into pages
    const numCards = Object.entries(cardList).length;

    if (numCards <= 0) {
        consola.log("No cards to process, exiting.");
        return;
    }
    const pages = divideCardsIntoPages(cardList, pageSize);
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

    // TODO: If need to retry, either queue the retry if option is enabled OR save all remaining cards to a list that we can specify with a flag

    await Promise.all(threadPool);
    clearInterval(progressBarPoll);

    if (needToRetry.length) {
        consola.error(`Processing completed with failures. Failed to generate ${totalError} images out of ${numCards} total.`);
        consola.info(`Failed images: ${needToRetry.map(item => item.id).join(", ")}`);
    } else {
        consola.success(`Processing completed successfully. Generated ${numCards} images (${totalSuccess} successful, ${totalError} failed, ${totalProcessed} processed).`);
    }
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

const divideCardsIntoPages = (cardList: Record<string, Card>, pageSize: number): ImageEntry[][] => {
    const pages: ImageEntry[][] = [];
    const cardEntries: ImageEntry[] = Object.entries(cardList).map(([id, card]) => ({id, card}));
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

const filterToDeck = (cardList: Record<string, Card>, deckList: DeckListEntry[]) => {
    const cardsToInclude = new Set(deckList.map(entry => entry.cardId));
    const seenCards = new Set();
    for (const cardId of Object.keys(cardList)) {
        if (!cardsToInclude.has(cardId)) {
            delete cardList[cardId];
        }
        seenCards.add(cardId);
    }
    if (deckList.length > Object.keys(cardList).length) {
        consola.warn(`Unknown card IDs: ${Array.from(cardsToInclude.difference(seenCards)).join(", ")}`);
    }
}

const generateImages = async (inputDir: string, outputDir: string, deckPath: string, removePath: string, siteUrl: string, recursive: boolean, taskLimit: number) => {
    ensureOutputDirExists(outputDir);
    const cardList = await readAndValidateFiles(inputDir, recursive);
    // TODO: Set these options
    if (false) {
        consola.log("Diff mode is enabled. Old images will be removed and only new ones will be updated.")
        await removeImages(removePath, outputDir);
        deckPath = deckPath || DEFAULT_DIFF;
    } else {
        clearFolder(outputDir, recursive, ".png");
    }

    consola.log(`Filtering to deck at ${deckPath}`);
    if (!fs.existsSync(deckPath)) {
        consola.warn("No decklist found. Are you sure you ran \"npm run decklist\"?");
    }
    const deckList = await readDeckList(deckPath);
    filterToDeck(cardList, deckList);
    if (!deckList.length) {
        consola.warn("No cards in provided decklist. Are you sure the one you're using is correct?")
    }

    if (!Object.keys(cardList).length) {
        // No data to process
        return;
    }

    await processCards(cardList, outputDir, siteUrl, taskLimit, 10);
};

const DEFAULT_DIFF = "./generated/tracked_changes/AddedOrUpdated.txt";
const DEFAULT_ALL = "./generated/decklists/Deck_All.txt";
const DEFAULT_RETRY = "./generated/tracked_changes/NeedToRetry.txt";
await main(async args => {
    const inputDir = args['input'] ?? "./generated/card_data";
    const outputDir = args['output'] ?? "./generated/card_images";
    const removePath = args['remove'] ?? "./generated/tracked_changes/Removed.txt";
    const siteUrl = args['site'] ?? "http://localhost:3000/";
    const recursive = args['r'] ?? false;
    const autoretry = args['autoretry'] ?? false;
    const exitearly = args['exitearly'] ?? false; // TODO: Can we combine these options?
    const taskLimit = args['chunk'] ?? 1;
    // TODO: Customize page size
    const deckPath = args['all'] ? DEFAULT_ALL : args['diff'] ? DEFAULT_DIFF : args['retry'] ? DEFAULT_RETRY : args['deck'] ?? DEFAULT_ALL;
    await generateImages(inputDir, outputDir, deckPath, removePath, siteUrl, recursive, taskLimit);
});
