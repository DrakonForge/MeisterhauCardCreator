import { checkInputPathExists, ensureOutputDirExists, main } from "./util/cliUtil";
import { consola } from "consola";
import path from "path";
import { createCardIdToPath } from "./util/cardIdToPath";
import sharp from "sharp";

const CARDS_PER_ROW = 10;
const CARDS_PER_COLUMN = 7;
const CARDS_PER_PAGE = CARDS_PER_ROW * CARDS_PER_COLUMN - 1; // Minus one for the back image

const IMAGE_WIDTH = 744;
const IMAGE_HEIGHT = 1038;

const createTabletopSimulatorDeckImage = async (inputDir: string, outputDir: string, cardBackPath: string, recursive: boolean): Promise<void> => {
    checkInputPathExists(inputDir);

    const cardIdToPath = await createCardIdToPath(inputDir, recursive);
    if (!cardIdToPath) {
        consola.error("No valid images found");
        return;
    }

    // Sort tokens to be last
    const cardIds = Object.keys(cardIdToPath);
    cardIds.sort((a, b) => {
        const isAToken = a.endsWith("_Token");
        const isBToken = b.endsWith("_Token");
        if (isAToken === isBToken) {
            return a.localeCompare(b);
        } else if (isAToken) {
            return 1;
        }
        return -1;
    });

    const numCardPages = Math.ceil(cardIds.length / CARDS_PER_PAGE);
    consola.info(`Found ${cardIds.length} image files requiring ${numCardPages} pages of cards`);

    ensureOutputDirExists(outputDir);

    for (let i = 0; i < numCardPages; ++i) {
        const startIndex = i * CARDS_PER_PAGE;
        createCardPage(cardIdToPath, cardIds, i * CARDS_PER_PAGE, Math.min(cardIds.length, startIndex + CARDS_PER_PAGE), cardBackPath, outputDir);
    }

    consola.success(`Successfully created ${numCardPages} pages of cards at ${outputDir}`);
}

const createCardPage = async (cardIdToPath: Record<string, string>, cardIds: string[], startIndex: number, endIndex: number, cardBackPath: string, outputDir: string) => {
    const fileName = `deck_${startIndex + 1}-${endIndex}.jpg`;
    const composite: sharp.OverlayOptions[] = [{
        input: cardBackPath,
        top: IMAGE_HEIGHT * CARDS_PER_COLUMN - IMAGE_HEIGHT,
        left: IMAGE_WIDTH * CARDS_PER_ROW - IMAGE_WIDTH
    }];

    // Gather all the images
    for (let i = startIndex; i < endIndex; ++i) {
        const cardId = cardIds[i];
        if (!cardId) {
            continue;
        }
        const imagePath = cardIdToPath[cardId];
        if (!imagePath) {
            continue;
        }

        const imagePosition = i - startIndex;
        const column = Math.floor(imagePosition / CARDS_PER_ROW);
        const row = imagePosition % CARDS_PER_ROW;
        composite.push({
            input: imagePath,
            top: column * IMAGE_HEIGHT,
            left: row * IMAGE_WIDTH
        });
    }

    sharp({
        create: {
            width: CARDS_PER_ROW * IMAGE_WIDTH,
            height: CARDS_PER_COLUMN * IMAGE_HEIGHT,
            channels: 3,
            background: '#000000'
        }
    })
    .composite(composite)
    .jpeg()
        .toFile(path.join(outputDir, fileName)).then(() => {
        consola.log(`Created ${fileName}`);
    }).catch(err => {
        consola.error(`Failed to create ${fileName}: ${err}`);
    })
}


await main(async args => {
    const inputDir = args['input'] ?? "./generated/card_images";
    const outputDir = args['output'] ?? "./generated/deck_images";
    const cardBackPath = args['back'] ?? "./src/assets/CardBack.png";
    const recursive = args['r'] ?? false;

    await createTabletopSimulatorDeckImage(inputDir, outputDir, cardBackPath, recursive);
});