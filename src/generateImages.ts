import puppeteer from "puppeteer";
import { readAndValidateFiles } from "./validation/parseFiles";
import * as path from "path";
import * as fs from "fs";
import { createProgressBar, delay, ensureOutputDirExists, main } from "./util/cliUtil";
import { consola } from "consola";

const generateImages = async (inputDir: string, outputDir: string, siteUrl: string, recursive: boolean) => {
    ensureOutputDirExists(outputDir);

    const cardList = await readAndValidateFiles(inputDir, recursive);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const response = await page.goto(siteUrl);
    const cardEntries = Object.entries(cardList);

    consola.log(`Connected to ${siteUrl}. Request status: ${response?.status()}`);

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
        await delay(10); // Wait for things to render
        const url = await displayImg?.evaluate(img => img.src);
        if (url) {
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

    consola.log("Cleaning up...")
    await browser.close();
    if (numFails) {
        consola.error(`Processing completed with failures. Failed to generate ${numFails} images out of ${numProcessed} total.`);
    } else {
        consola.success(`Processing completed successfully. Generated ${numProcessed} images.`);
    }
}

await main(async args => {
    const inputDir = args['input'] ?? "./test_data";
    const outputDir = args['output'] ?? "./generated/card_images";
    const siteUrl = args['site'] ?? "http://localhost:3000/";
    const recursive = args['r'] ?? true;
    await generateImages(inputDir, outputDir, siteUrl, recursive);
});
