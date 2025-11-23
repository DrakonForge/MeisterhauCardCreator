import * as fs from "fs";
import { readdir } from "fs/promises";
import * as path from "path";
import type { Card } from "../types/card";
import { validateCardFromJson } from "./validation";


export const readAndValidateFiles = async (inputDir: string, recursive = false): Promise<Record<string, Card>> => {
    let inputFiles: string[];
    try {
        inputFiles = await readdir(inputDir, { recursive });
    } catch (e) {
        console.error("Error encountered while reading files", e);
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
        console.debug(`Processing ${cardId}`);

        // Read data
        let rawData;
        try {
            const fileData = fs.readFileSync(filePath);
            rawData = JSON.parse(fileData.toString());
        } catch (e) {
            console.error(`Failed to read file ${filePath}`, e);
            numError++;
            continue;
        }

        // console.debug(JSON.stringify(rawData));
        try {
            const card = validateCardFromJson(rawData);
            cardMap[cardId] = card;
        } catch (e) {
            console.warn(`Zod validation error for ${cardId}: ${e}`);
            numValidationFailed++;
            continue;
        }

        numSuccess++;
    }

    console.log(`${(numError || numValidationFailed) ? "FAILED" : "SUCCESS"} - Validation Failed: ${numValidationFailed}, Error: ${numError}, Success: ${numSuccess}, Total: ${numSuccess + numError + numValidationFailed}`);
    return cardMap;
};
