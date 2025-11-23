import puppeteer from "puppeteer";
import { readAndValidateFiles } from "./validation/parseFiles";
import * as path from "path";
import * as fs from "fs";

// TODO: Make these parameters
const LOCAL_URL = "http://localhost:3000/";
const INPUT_PATH = "test_data";
const OUTPUT_PATH = "generated/card_images";

const delay = (time: number) => {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

const generateImages = async () => {
    if (!fs.existsSync(OUTPUT_PATH)) {
        fs.mkdirSync(OUTPUT_PATH);
    }

    const cardList = await readAndValidateFiles(INPUT_PATH, false);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const response = await page.goto(LOCAL_URL);

    console.log(`Connected to ${LOCAL_URL}. Request status: ${response?.status()}`);

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
            const filePath = path.join(OUTPUT_PATH, key + ".png");
            console.debug("Writing image to", filePath);
            fs.writeFileSync(filePath, await viewSource?.buffer()!);
            await imgPage.close();
        } else {
            console.log("Failed to find img");
        }
    }

    await browser.close();
}
await generateImages();