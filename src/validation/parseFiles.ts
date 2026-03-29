import * as fs from "fs";
import { open, readdir } from "fs/promises";
import * as path from "path";
import type { Card } from "../types/card";
import { validateCardFromJson } from "./validation";
import { consola } from "consola";
import { checkInputPathExists } from "../util/cliUtil";

export interface DeckListEntry {
    cardId: string;
    quantity: number;
}

export const cardIdsToEntries = (cardIds: string[]): DeckListEntry[] => {
    let entries: DeckListEntry[] = [];
    for (const cardId of cardIds) {
        entries.push({ cardId, quantity: 1 });
    }
    return entries;
}

export const readDecklist = async (inputPath: string, cardIdToPath: Record<string, string>): Promise<DeckListEntry[]> => {
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

        if (!(cardId in cardIdToPath)) {
            throw new Error(`Unable to find card ID ${cardId} in provided image directory`);
        }

        entries.push({ cardId, quantity });
    }
    return entries;
}

export const getUniqueCardIds = (entries: DeckListEntry[]): Set<string> => {
    const uniqueCardIds = new Set<string>();
    for (const entry of entries) {
        uniqueCardIds.add(entry.cardId);
    }
    return uniqueCardIds;
}

export const getTotalCardQuantity = (entries: DeckListEntry[]): number => {
    let numTotalCards = 0;
    for (const entry of entries) {
        numTotalCards += entry.quantity;
    }
    return numTotalCards;
}

export const readAndValidateFiles = async (inputDir: string, recursive = false): Promise<Record<string, Card>> => {
    checkInputPathExists(inputDir);

    let inputFiles: string[];
    try {
        inputFiles = await readdir(inputDir, { recursive });
    } catch (e) {
        consola.error("Error encountered while reading files", e);
        return {};
    }

    let numSuccess = 0;
    let numValidationFailed = 0;
    let numError = 0;
    const cardMap: Record<string, Card> = {};
    for (const file of inputFiles) {
        if (!file.endsWith(".json")) {
            continue;
        }
        const cardId = file.substring(0, file.length - ".json".length);
        const filePath = path.join(inputDir, file);
        consola.debug(`Processing ${cardId}`);

        // Read data
        let rawData;
        try {
            const fileData = fs.readFileSync(filePath);
            rawData = JSON.parse(fileData.toString());
        } catch (e) {
            consola.error(`Failed to read file ${filePath}`, e);
            numError++;
            continue;
        }

        consola.debug(JSON.stringify(rawData));
        try {
            const card = validateCardFromJson(rawData);
            cardMap[cardId] = card;
        } catch (e) {
            consola.warn(`Zod validation error for ${cardId}: ${e}`);
            numValidationFailed++;
            continue;
        }

        numSuccess++;
    }

    const numTotal = numSuccess + numError + numValidationFailed;
    if (numError || numValidationFailed) {
        consola.fail(`Failed to validate ${numValidationFailed} files, with ${numError} other unspecified errors. Processed ${numTotal} files total.`);
    } else {
        consola.success(`Validated ${numTotal} files successfully`);
    }
    return cardMap;
};
