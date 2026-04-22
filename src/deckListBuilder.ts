import { ensureOutputDirExists, main } from "./util/cliUtil";
import { consola } from "consola";
import path from "path";
import * as fs from "fs";
import { readAndValidateFiles } from "./validation/parseFiles";
import type { Card } from "./types/card";

const DECK_ALL = "All";

interface CardAndQuantity {
    cardId: string;
    quantity: number;
}

const generateDeckLists = async (inputDir: string, outputDir: string, includeExpansions: string[], recursive: boolean): Promise<void> => {
    ensureOutputDirExists(outputDir);
    const cardList = await readAndValidateFiles(inputDir, recursive);
    const cardsByDeck = getCardsByDeck(cardList, includeExpansions);

    for (const [deckName, deckEntries] of Object.entries(cardsByDeck)) {
        const fileName = "Deck_" + deckName;
        const inputPath = path.join(outputDir, fileName + ".txt");

        let deckList = "";
        let numCardsInDeck = 0;
        for (const cardAndQuantity of deckEntries) {
            deckList += toEntry(cardAndQuantity) + "\n";
            numCardsInDeck += cardAndQuantity.quantity;
        }
        fs.writeFileSync(inputPath, deckList)
        consola.log(`Created ${fileName} with ${numCardsInDeck} cards`);
    }
}

const toEntry = (cardAndQuantity: CardAndQuantity) => {
    if (cardAndQuantity.quantity > 1) {
        return cardAndQuantity.cardId + " " + cardAndQuantity.quantity;
    }
    return cardAndQuantity.cardId;
}

const getCardsByDeck = (cardList: Record<string, Card>, includeExpansions: string[]): Record<string, CardAndQuantity[]> => {
    const cardsByDeck: Record<string, CardAndQuantity[]> = {
        [DECK_ALL]: []
    };

    if (includeExpansions.length) {
        consola.info(`Including only expansions: ${includeExpansions}`);
    }

    for (const [cardId, card] of Object.entries(cardList)) {
        if (includeExpansions.length) {
            if (!includeExpansions.includes(card.Expansion)) {
                continue;
            }
        }
        const deck = card.Deck;
        let quantity = card.Quantity;

        cardsByDeck[DECK_ALL]?.push({cardId, quantity});

        // Special rule to make TTS printing easier -- only print one copy of starter deck
        if (deck == "Fundamentals") {
            quantity /= 2;
        }

        if (!cardsByDeck[deck]) {
            cardsByDeck[deck] = [];
        }
        cardsByDeck[deck].push({cardId, quantity});
    }

    return cardsByDeck;
}

await main(async args => {
    const inputDir = args['input'] ?? "./generated/card_data";
    const outputDir = args['output'] ?? "./generated/decklists";
    const recursive = args['r'] ?? false;
    const includeExpansions = args['expansion'] ? args['expansion'].split(',') : [];

    await generateDeckLists(inputDir, outputDir, includeExpansions, recursive);
});