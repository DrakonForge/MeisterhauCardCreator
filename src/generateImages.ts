import puppeteer from "puppeteer";
import { readAndValidateFiles } from "./validation/parseFiles";
import * as path from "path";
import * as fs from "fs";
import { createProgressBar, ensureOutputDirExists, main } from "./util/cliUtil";
import { consola } from "consola";
import type { Card } from "./types/card";

const CONCURRENT_TASK_LIMIT = 5;
const processCardsParallel = async (cardList: Record<string, Card>, outputDir: string, siteUrl: string): Promise<void> => {
    consola.log("Running parallel task.");
    const cardEntries = Object.entries(cardList);
    const tasks = [];
    const executing = new Set();

    consola.log(`Started ${cardEntries.length} tasks...`);
    consola.log(`Progress: ${createProgressBar(0, 10)} (0/${cardEntries.length})`);

    let numProcessed = 0;
    let numFails = 0;
    const updateProgress = (success: boolean) => {
        numProcessed++;
        if (!success) {
            numFails++;
        }
        consola.log(`Progress: ${createProgressBar(numProcessed / cardEntries.length, 10)} (${numProcessed}/${cardEntries.length})`);
    }

    for (const [key, card] of cardEntries) {
        const task = processCardParallel(key, card, outputDir, siteUrl).then(t => {
            updateProgress(t);
            executing.delete(task);
            return t;
        }).catch((e) => {
            consola.error(`Failed to process image ${key}: `, e);
            updateProgress(false);
        });

        tasks.push(task);
        executing.add(task);

        if (executing.size >= CONCURRENT_TASK_LIMIT) {
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
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const response = await page.goto(siteUrl);

    consola.debug(`Connected to ${siteUrl}. Request status: ${response?.status()}`);
    consola.debug(`Starting task for ${card.Name}`);

    const textarea = await page.$("textarea.json-entry");
    const updateButton = await page.$('button.update-button');
    const displayImg = await page.$('.card-display-output > img');

    // Should be a fresh window, so no need to clear
    await textarea?.type(JSON.stringify(card));
    await updateButton?.click();

    // Wait for process to finish
    await page.waitForFunction('window.status === "ready" || window.status === "fail"', {
        polling: 100,
        timeout: 15000,
    });
    const status = await page.evaluate("window.status");
    if (status !== "ready") {
        const errorMessage = await page.evaluate("window.errorMessage");
        consola.error(`Failed to render image for ${key}, error: ${errorMessage}`);
        await browser.close();
        return false;
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
}

const processCardsSequential = async (cardList: Record<string, Card>, outputDir: string, siteUrl: string): Promise<void> => {
    consola.log("Running synchronous task.");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const response = await page.goto(siteUrl);
    const cardEntries = Object.entries(cardList);

    consola.log(`Connected to ${siteUrl}. Request status: ${response?.status()}`);
    consola.log(`Progress: ${createProgressBar(0, 10)} (0/${cardEntries.length})`);

    const textarea = await page.$("textarea.json-entry");
    const updateButton = await page.$('button.update-button');
    const displayImg = await page.$('.card-display-output > img');
    let numProcessed = 0;
    let numFails = 0;

    for (const [key, card] of cardEntries) {
        numProcessed++;
        consola.log(`Progress: ${createProgressBar(numProcessed / cardEntries.length, 10)} (${numProcessed}/${cardEntries.length})`);
        consola.debug(`Received ${key}`);
        await textarea?.evaluate(element => element.value = '');
        await textarea?.type(JSON.stringify(card));
        await updateButton?.click();

        // Wait for process to finish
        await page.waitForFunction('window.status === "ready" || window.status === "fail"', {
            polling: 100,
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
            await imgPage.close();
        } else {
            consola.error(`Failed to find image for ${key}`);
            numFails++;
        }
    }

    consola.log("Cleaning up...");
    await browser.close();
    if (numFails) {
        consola.error(`Processing completed with failures. Failed to generate ${numFails} images out of ${cardEntries.length} total.`);
    } else {
        consola.success(`Processing completed successfully. Generated ${cardEntries.length} images.`);
    }
}

const generateImages = async (inputDir: string, outputDir: string, siteUrl: string, recursive: boolean, sync: boolean) => {
    ensureOutputDirExists(outputDir);
    const cardList = await readAndValidateFiles(inputDir, recursive);
    if (sync) {
        await processCardsSequential(cardList, outputDir, siteUrl);
    } else {
        await processCardsParallel(cardList, outputDir, siteUrl);
    }
};

await main(async args => {
    const inputDir = args['input'] ?? "./generated/card_data";
    const outputDir = args['output'] ?? "./generated/card_images";
    const siteUrl = args['site'] ?? "http://localhost:3000/";
    const recursive = args['r'] ?? true;
    const sync = args['sync'] ?? false;
    await generateImages(inputDir, outputDir, siteUrl, recursive, sync);
});
