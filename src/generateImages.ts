import puppeteer from "puppeteer";
import { readAndValidateFiles } from "./validation/parseFiles";
import * as path from "path";
import * as fs from "fs";
import { delay, ensureDirExists, main } from "./util/cliUtil";

const generateImages = async (inputDir: string, outputDir: string, siteUrl: string, recursive: boolean) => {
    ensureDirExists(outputDir);

    const cardList = await readAndValidateFiles(inputDir, recursive);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const response = await page.goto(siteUrl);

    console.log(`Connected to ${siteUrl}. Request status: ${response?.status()}`);

    const textarea = await page.$("textarea.json-entry");
    const updateButton = await page.$('button.update-button');
    const displayImg = await page.$('.card-display-output > img');
    for (const [key, card] of Object.entries(cardList)) {
        await textarea?.evaluate(element => element.value = '');
        await textarea?.type(JSON.stringify(card));
        await updateButton?.click();
        await delay(1000);
        const url = await displayImg?.evaluate(img => img.src);
        if (url) {
            const imgPage = await browser.newPage();
            const viewSource = await imgPage.goto(url);
            const filePath = path.join(outputDir, key + ".png");
            console.debug("Writing image to", filePath);
            fs.writeFileSync(filePath, await viewSource?.buffer()!);
            await imgPage.close();
        } else {
            console.log("Failed to find img");
        }
    }

    await browser.close();
}

await main(async args => {
    const inputDir = args['input'] ?? "./test_data";
    const outputDir = args['output'] ?? "./generated/card_images";
    const siteUrl = args['site'] ?? "http://localhost:3000/";
    const recursive = args['r'] ?? true;
    await generateImages(inputDir, outputDir, siteUrl, recursive);
});
