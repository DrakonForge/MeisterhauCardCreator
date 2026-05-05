import * as fs from "fs";
import { open } from "fs/promises";
import path from "path";
import { checkInputPathExists } from "./cliUtil";

export interface DeckListEntry {
    cardId: string;
    quantity: number;
}

export const generateDeckList = async (id: string, deckEntries: DeckListEntry[], outputDir: string) => {
    const outputPath = path.join(outputDir, id + ".txt");
    let deckList = "";
    let numCardsInDeck = 0;
    for (const cardAndQuantity of deckEntries) {
        deckList += toEntry(cardAndQuantity) + "\n";
        numCardsInDeck += cardAndQuantity.quantity;
    }
    fs.writeFileSync(outputPath, deckList);
};

export const toEntry = (cardAndQuantity: DeckListEntry) => {
    if (cardAndQuantity.quantity > 1) {
        return cardAndQuantity.cardId + " " + cardAndQuantity.quantity;
    }
    return cardAndQuantity.cardId;
};

export const readDeckList = async (inputPath: string, cardIdToPath?: Record<string, string>): Promise<DeckListEntry[]> => {
    checkInputPathExists(inputPath);

    const file = await open(inputPath);
    const entries: DeckListEntry[] = [];
    for await (const line of file.readLines()) {
        const lineText = line.trim();

        // Skip blank lines or comments
        if (!lineText || lineText.startsWith("#")) {
            continue;
        }

        const words = line.split(' ');
        let cardId: string;
        let quantity: number;
        if (words.length > 2) {
            throw new Error("Must be in format <CardId> [Quantity]. CardId must be a single word");
        } if (words[0] && words[1]) {
            cardId = words[0];
            quantity = parseInt(words[1]);
        } else {
            cardId = lineText;
            quantity = 1;
        }

        if (cardIdToPath != null && !(cardId in cardIdToPath)) {
            throw new Error(`Unable to find card ID ${cardId} in provided image directory`);
        }

        entries.push({ cardId, quantity });
    }
    return entries;
};

export const cardIdsToEntries = (cardIds: string[]): DeckListEntry[] => {
    let entries: DeckListEntry[] = [];
    for (const cardId of cardIds) {
        entries.push({ cardId, quantity: 1 });
    }
    return entries;
};

export const getUniqueCardIds = (entries: DeckListEntry[]): Set<string> => {
    const uniqueCardIds = new Set<string>();
    for (const entry of entries) {
        uniqueCardIds.add(entry.cardId);
    }
    return uniqueCardIds;
};

export const getTotalCardQuantity = (entries: DeckListEntry[]): number => {
    let numTotalCards = 0;
    for (const entry of entries) {
        numTotalCards += entry.quantity;
    }
    return numTotalCards;
};

