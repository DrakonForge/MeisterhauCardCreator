import { checkInputPathExists, ensureOutputDirExists, main } from "./util/cliUtil";
import { consola } from "consola";
import path from "path";
import { createCardIdToPath } from "./util/cardIdToPath";
import sharp from "sharp";
import { cardIdsToEntries, readDecklist, type DeckListEntry } from "./validation/parseFiles";
import { readdir } from "fs/promises";

const CARDS_PER_ROW = 10;
const CARDS_PER_COLUMN = 4;
const CARDS_PER_PAGE = CARDS_PER_ROW * CARDS_PER_COLUMN - 1;

const IMAGE_WIDTH = 744;
const IMAGE_HEIGHT = 1038;

let totalNumPages = 0;
const createTabletopSimulatorDeckImage = async (inputDir: string, deckDir: string, outputDir: string, cardBackPath: string, recursive: boolean, all: boolean, ignore: string[], include: string[]): Promise<void> => {
    checkInputPathExists(inputDir);

    const cardIdToPath = await createCardIdToPath(inputDir, recursive);
    if (!cardIdToPath) {
        consola.error("No valid images found");
        return;
    }

    ensureOutputDirExists(outputDir);

    const cardIds = Object.keys(cardIdToPath);
    if (all) {
        consola.info("Creating images for ALL cards in a single deck");
        const cardEntries = cardIdsToEntries(cardIds);
        await createImagesForDeck("Deck_All", cardEntries, cardIdToPath, cardBackPath, outputDir);
    } else {
        const deckListToPath: Record<string, string> = await retrieveDeckLists(deckDir, recursive, ignore, include);
        const tasks = [];
        for (const [deckListId, deckListPath] of Object.entries(deckListToPath)) {
            const cardEntries = await readDecklist(deckListPath, cardIdToPath);
            consola.debug(`Creating deck images for ${deckListId}`);
            tasks.push(createImagesForDeck(deckListId, cardEntries, cardIdToPath, cardBackPath, outputDir));
        }
        await Promise.allSettled(tasks);
    }

    consola.success(`Successfully created ${totalNumPages} page(s) of cards`);
}

const retrieveDeckLists = async (deckDir: string, recursive: boolean, ignore: string[], include: string[]): Promise<Record<string, string>> => {
    checkInputPathExists(deckDir);
    let deckListFiles;
    try {
        deckListFiles = await readdir(deckDir, { recursive });
    } catch (e) {
        consola.error("Error encountered while reading decklist files", e);
        throw e;
    }

    const deckListToPath: Record<string, string> = {};
    for (const file of deckListFiles) {
        if (!file.endsWith(".txt")) {
            continue;
        }
        const deckListId = file.substring(0, file.length - ".txt".length);
        const deckListPath = path.join(deckDir, file);
        deckListToPath[deckListId] = deckListPath;
    }

    let deckLists = Object.keys(deckListToPath);
    if (include.length) {
        consola.info(`Including only deck lists: ${include.join(", ")}`)
        deckLists = deckLists.filter(deckList => include.includes(deckList));
    }

    if (ignore.length) {
        consola.info(`Ignoring deck lists: ${ignore.join(", ")}`);
        deckLists = deckLists.filter(deckList => !ignore.includes(deckList));
    }

    const result: Record<string, string> = {};
    for (const deckList of deckLists) {
        if (deckListToPath[deckList]) {
            result[deckList] = deckListToPath[deckList];
        }
    }

    consola.info(`Generating images from ${deckLists.length} decklists`);
    return result;
}

const createImagesForDeck = async (deckId: string, entries: DeckListEntry[], cardIdToPath: Record<string, string>, cardBackPath: string, outputDir: string): Promise<void> => {
    const cardIds = entries.map(entry => entry.cardId);

    // Sort tokens to be last
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
    consola.debug(`Found ${cardIds.length} image files requiring ${numCardPages} pages of cards`);
    const tasks = [];
    for (let i = 0; i < numCardPages; ++i) {
        const startIndex = i * CARDS_PER_PAGE;
        tasks.push(createCardPage(deckId, cardIdToPath, cardIds, i * CARDS_PER_PAGE, Math.min(cardIds.length, startIndex + CARDS_PER_PAGE), cardBackPath, outputDir));
    }

    await Promise.allSettled(tasks);
    consola.log(`Created ${numCardPages} page(s) of cards for ${deckId}`);
    totalNumPages += numCardPages;
}

const createCardPage = async (deckId: string, cardIdToPath: Record<string, string>, cardIds: string[], startIndex: number, endIndex: number, cardBackPath: string, outputDir: string) => {
    const fileName = `${deckId}_${startIndex + 1}-${endIndex}.jpg`;
    // Apparently the card back path doesn't matter so much, so it's getting overwritten here
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

    try {
        await sharp({
            create: {
                width: CARDS_PER_ROW * IMAGE_WIDTH,
                height: CARDS_PER_COLUMN * IMAGE_HEIGHT,
                channels: 3,
                background: '#000000'
            }
        })
            .composite(composite)
            .jpeg()
            .toFile(path.join(outputDir, fileName));
    } catch(e) {
        consola.error(`Failed to create ${fileName}: ${e}`);
    }

    consola.debug(`Created ${fileName}`);
}

const parseStringList = (stringList: string): string[] => {
    return stringList.trim().split(",").map(entry => entry.trim());
}

await main(async args => {
    const inputDir = args['input'] ?? "./generated/card_images";
    const deckDir = args['decks'] ?? "./generated/decklists";
    const outputDir = args['output'] ?? "./generated/deck_images";
    const cardBackPath = args['back'] ?? "./src/assets/CardBack.png";
    const recursive = args['r'] ?? false;

    const ignore = args['ignore'] ? parseStringList(args['ignore']) : ['Deck_All', 'Deck_Forbidden'];
    const include = args['include'] ? parseStringList(args['include']) : [];
    const all = args['all'] ?? false;

    await createTabletopSimulatorDeckImage(inputDir, deckDir, outputDir, cardBackPath, recursive, all, ignore, include);
});