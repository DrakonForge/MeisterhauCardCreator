import * as fs from "fs";
import { readdir } from "fs/promises";
import * as path from "path";
import type { Card } from "../types/card";
import { validateCardFromJson } from "./validation";
import { consola } from "consola";
import { checkInputPathExists } from "../util/cliUtil";


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
