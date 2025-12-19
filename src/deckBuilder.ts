import { open, readdir } from "fs/promises";
import { checkInputPathExists, ensureOutputDirExists, main } from "./util/cliUtil";
import { consola } from "consola";
import path from "path";
import * as fs from "fs";

const createTabletopSimulatorDeck = async (imageDir: string, cardBackPath: string, inputPath: string, outputDir: string, recursive: boolean): Promise<void> => {
    checkInputPathExists(inputPath);
    checkInputPathExists(imageDir);

    const cardIdToPath = await createCardIdToPath(imageDir, recursive);
    if (!cardIdToPath) {
        consola.error("No valid images found");
        return;
    }

    consola.info(`Found ${Object.keys(cardIdToPath).length} image files`);

    ensureOutputDirExists(outputDir);

    const file = await open(inputPath);
    const tasks = [];
    let success = true;
    let numCreated = 0;
    let deckSize = 0;
    for await (const line of file.readLines()) {
        const lineText = line.trim();

        // Skip blank lines or comments
        if (!lineText || lineText.startsWith("#")) {
            continue;
        }

        const words = line.split(' ');
        let cardId: string;
        let count: number;
        if (words.length > 2) {
            console.error("Must be in format <CardId> [Quantity]. CardId must be a single word");
            success = false;
            break;
        } if (words[0] && words[1]) {
            cardId = words[0];
            count = parseInt(words[1]);
        } else {
            cardId = lineText;
            count = 1;
        }

        const sourcePath = cardIdToPath[cardId];
        if (!sourcePath) {
            console.error(`Unable to find card ID ${cardId} in provided image directory`);
            success = false;
            break;
        }
        numCreated++;
        const fileName = `${('0' + count).slice(-2)}x ${cardId}.png`;
        const outputPath = path.join(outputDir, fileName);
        tasks.push(fs.copyFile(sourcePath, outputPath, (err) => {
            if (err) {
                throw err;
            }
        }));
        deckSize += count;
    }

    // Finally, copy over the card back
    tasks.push(fs.copyFile(cardBackPath, path.join(outputDir, "00 Back.png"), (err) => {
        if (err) {
            throw err;
        }
    }));

    await Promise.all(tasks);

    if (success) {
        consola.success(`Successfully created ${numCreated} files to generate a deck of size ${deckSize} at ${outputDir}`);
    } else {
        consola.fail(`Generation failed, some cards may still be generated at ${outputDir}`);
    }
}

const createCardIdToPath = async (imageDir: string, recursive: boolean): Promise<Record<string, string> | null> => {
    const cardIdToPath: Record<string, string> = {};
    let imageFiles: string[]
    try {
        imageFiles = await readdir(imageDir, { recursive });
    } catch (e) {
        consola.error("Error encountered while reading image files", e);
        return null;
    }

    for (const file of imageFiles) {
        if (!file.endsWith(".png")) {
            continue;
        }
        const cardId = file.substring(0, file.length - ".png".length);
        const imagePath = path.join(imageDir, file);
        cardIdToPath[cardId] = imagePath;
    }

    return cardIdToPath;
}

await main(async args => {
    const imageDir = args['images'] ?? "./generated/card_images";
    const cardBackPath = args['back'] ?? "./src/assets/CardBack.png";
    const inputPath = args['input'] ?? "./MeisterhauCardData/deck.txt";
    const outputDir = args['output'] ?? "./generated/output_deck";
    const recursive = args['r'] ?? false;

    await createTabletopSimulatorDeck(imageDir, cardBackPath, inputPath, outputDir, recursive);
});