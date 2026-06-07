import { clearFolder, ensureOutputDirExists, main } from "./util/cliUtil";
import { consola } from "consola";
import { readAndValidateFiles } from "./validation/parseFiles";
import type { Card } from "./types/card";
import { generateDeckList, getTotalCardQuantity, type DeckListEntry } from "./util/decklist";

const DECK_ALL = "All";

const generateDeckLists = async (inputDir: string, outputDir: string, includeExpansions: string[], recursive: boolean): Promise<void> => {
    ensureOutputDirExists(outputDir);
    clearFolder(outputDir, recursive, ".txt");
    const cardList = await readAndValidateFiles(inputDir, recursive);
    const cardsByDeck = getCardsByDeck(cardList, includeExpansions);

    for (const [deckName, deckEntries] of Object.entries(cardsByDeck)) {
        const deckId = "Deck_" + deckName;
        await generateDeckList(deckId, deckEntries, outputDir);
        const numCardsInDeck = getTotalCardQuantity(deckEntries);
        consola.log(`Created ${deckId} with ${numCardsInDeck} cards`);
    }
}

const getCardsByDeck = (cardList: Record<string, Card>, includeExpansions: string[]): Record<string, DeckListEntry[]> => {
    const cardsByDeck: Record<string, DeckListEntry[]> = {
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
        let quantity = card.Quantity || 1;
        // Special rule to make PDF printing easier: Fundamentals is printed twice
        if (deck == "Fundamentals") {
            cardsByDeck[DECK_ALL]?.push({ cardId, quantity: quantity * 2 });
        } else {
            cardsByDeck[DECK_ALL]?.push({ cardId, quantity: quantity });
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
    args['expansion'] = args['expansion'] ?? args['exp'] ?? args['e'];
    const includeExpansions = args['all'] ? [] : (args['expansion'] ? args['expansion'].split(',') : ["Core"]);

    await generateDeckLists(inputDir, outputDir, includeExpansions, recursive);
});