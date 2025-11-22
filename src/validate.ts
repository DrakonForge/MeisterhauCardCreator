import { readdir } from 'node:fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { validateCardFromJson } from './validation/validation';

const TEST_FOLDER = "./test_data";

// TODO: Make these CLI args
const recursive = true;
const inputDir = TEST_FOLDER;


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

        try {
            validateCardFromJson(rawData);
        } catch(e) {
            console.warn(`Zod validation error for ${file}: ${e}`);
            numValidationFailed++;
            continue;
        }

        numSuccess++;
    }

    console.log(`${(numError || numValidationFailed) ? "FAILED" : "SUCCESS"} - Validation Failed: ${numValidationFailed}, Error: ${numError}, Success: ${numSuccess}, Total: ${numSuccess + numError + numValidationFailed}`);
}

await validate();
