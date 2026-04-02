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

const toEntry = (cardId: string, quantity: number) => {
    if (quantity > 1) {
        return cardId + " " + quantity;
    }
    return cardId;
}

const getCardsByDeck = (cardList: Record<string, Card>): Record<string, string[]> => {
    const cardsByDeck: Record<string, string[]> = {
        [DECK_ALL]: []
    };

    for (const [cardId, card] of Object.entries(cardList)) {
        const deck = card.Deck;
        let quantity = card.Quantity;

        cardsByDeck[DECK_ALL]?.push(toEntry(cardId, quantity));

        // Special rule to make TTS printing easier -- only print one copy of starter deck
        if (deck == "Fundamentals") {
            quantity /= 2;
        }

        if (!cardsByDeck[deck]) {
            cardsByDeck[deck] = [];
        }
        cardsByDeck[deck].push(toEntry(cardId, quantity));
    }

    return cardsByDeck;
}

await main(async args => {
    const inputDir = args['input'] ?? "./generated/card_data";
    const outputDir = args['output'] ?? "./generated/decklists";
    const recursive = args['r'] ?? false;

    await generateDeckLists(inputDir, outputDir, recursive);
});