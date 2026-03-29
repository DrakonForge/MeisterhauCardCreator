import { ensureOutputDirExists, main } from "./util/cliUtil";
import { consola } from "consola";
import path from "path";
import * as fs from "fs";
import { readAndValidateFiles } from "./validation/parseFiles";
import type { Card } from "./types/card";

const DECK_ALL = "All";

const generateDeckLists = async (inputDir: string, outputDir: string, recursive: boolean): Promise<void> => {
    ensureOutputDirExists(outputDir);
    const cardList = await readAndValidateFiles(inputDir, recursive);
    const cardsByDeck = getCardsByDeck(cardList);

    for (const [deckName, cardsInDeck] of Object.entries(cardsByDeck)) {
        const fileName = "Deck_" + deckName;
        const inputPath = path.join(outputDir, fileName + ".txt");

        let deckList = "";
        for (const card of cardsInDeck) {
            deckList += card + "\n";
        }
        fs.writeFileSync(inputPath, deckList)
        consola.log(`Created ${fileName} with ${cardsInDeck.length} cards`);
    }
}

const getCardsByDeck = (cardList: Record<string, Card>): Record<string, string[]> => {
    const cardsByDeck: Record<string, string[]> = {
        [DECK_ALL]: []
    };

    for (const [cardId, card] of Object.entries(cardList)) {
        cardsByDeck[DECK_ALL]?.push(cardId);
        if (card.Type === "Action") {
            const deck = card.Deck;
            if (!cardsByDeck[deck]) {
                cardsByDeck[deck] = [];
            }
            cardsByDeck[deck].push(cardId);
        } else {
            // TODO: Handle other card types
        }
    }

    return cardsByDeck;
}

await main(async args => {
    const inputDir = args['input'] ?? "./generated/card_data";
    const outputDir = args['output'] ?? "./generated/decklists";
    const recursive = args['r'] ?? false;

    await generateDeckLists(inputDir, outputDir, recursive);
});