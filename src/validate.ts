import { readdir } from 'node:fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { CardSchema } from './types/card';

const TEST_FOLDER = "./test_data";

// TODO: Make these CLI args
const recursive = true;
const inputDir = TEST_FOLDER;

// TODO: Support validation for guard JSON as well
const validate = async () => {
    let inputFiles: string[];
    try {
        inputFiles = await readdir(inputDir, { recursive });
    } catch(e) {
        console.error("Error encountered while reading files", e);
        return;
    }

    let numSuccess = 0;
    let numValidationFailed = 0;
    let numError = 0;
    for (const file of inputFiles) {
        if (!file.endsWith(".json")) {
            continue;
        }
        const filePath = path.join(TEST_FOLDER, file)
        console.debug(`Processing ${filePath}`);

        // Read data
        let rawData;
        try {
            const fileData = fs.readFileSync(filePath);
            rawData = JSON.parse(fileData.toString());
        } catch(e) {
            console.error(`Failed to read file ${filePath}`, e);
            numError++;
            continue;
        }

        // console.debug(JSON.stringify(rawData));

        const result = CardSchema.safeParse(rawData);
        if (!result.success) {
            console.warn(`Zod validation error for ${file}: ${result.error}`);
            numValidationFailed++;
            continue;
        }

        // TODO: Also validate the text rendering and other properties

        numSuccess++;
    }

    // TODO: Also test for missing keys, missing behaviors, using keywords incorrectly, overlapping names, etc. as warnings
    // TODO: Grammar, missing periods, etc.
    console.log(`${(numError || numValidationFailed) ? "FAILED" : "SUCCESS"} - Validation Failed: ${numValidationFailed}, Error: ${numError}, Success: ${numSuccess}, Total: ${numSuccess + numError + numValidationFailed}`);
}

await validate();
