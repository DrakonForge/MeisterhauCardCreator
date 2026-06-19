import { consola } from "consola";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";
import stringify from "json-stringify-pretty-compact";
import { checkInputPathExists } from "../util/cliUtil";
import { parseString, parseText, validateId } from "./convertHelpers";
import type { TrainingCard } from "../types/card";
import { validateTrainingCard } from "../validation/validation";
import type { GenerationContext } from "../convertCsv";
import type { Deck } from "../types/common";
import { generateSerial } from "../site/util/cardSerializer";

interface RowData {
    Id: string;
    Name: string;
    TrainingType: string;
    Deck: string;
    Secondary: string; // Unused for now
    Text: string;
    Flavor: string;
    Expansion: string;
    Art: string;
    Quantity: string;
    Notes: string;
}

const HEADERS: (keyof RowData)[] = [
    "Id",
    "Name",
    "TrainingType",
    "Deck",
    "Secondary",
    "Text",
    "Flavor",
    "Expansion",
    "Art",
    "Quantity",
    "Notes",
];

const REQUIRED_FIELDS: (keyof RowData)[] = [
    "Id",
    "Name",
    "Deck",
    "Text",
    "Expansion",
    "Art",
];

const checkRequiredFields = (data: RowData, requiredFields: (keyof RowData)[]): string[] => {
    const missingFields = [];
    for (const field of requiredFields) {
        if (!data[field]) {
            missingFields.push(field);
        }
    }
    return missingFields;
};

const shouldHandleRecord = (record: RowData): boolean => {
    return !record.Notes.includes("IDEA");
}

const handleRecord = (record: RowData, context: GenerationContext): boolean => {
    const baseId = parseString(record.Id);
    consola.debug(`Processing ${baseId}`);
    const quantity = record.Quantity ? parseInt(record.Quantity) || 1 : 1;
    for (let i = 1; i <= quantity; ++i) {
        const copyId = "Training_" + (quantity > 1 ? (baseId + `_${String(i).padStart(2, '0')}`) : baseId);
        record.Id = copyId;
        try {
            const jsonData = convertCsvToJson(record, context);
            const filePath = path.join(context.outputDir, copyId + ".json");
            fs.writeFileSync(filePath, stringify(jsonData, {
                indent: 4,
                maxLength: 50,
            }));
            consola.debug(`Generated ${copyId}.json`);
        } catch (e) {
            consola.error(`Failed to validate card ${copyId}:`, e);
            return false;
        }
    }
    return true;
};

const convertCsvToJson = (data: RowData, context: GenerationContext): TrainingCard => {
    const { seenIds, serials } = context;
    const missingFields = checkRequiredFields(data, REQUIRED_FIELDS);
    if (missingFields.length) {
        throw new Error(`Missing required base fields: ${missingFields.join(', ')}`);
    }

    const name = parseString(data.Name);
    const deck: Deck = "Training";
    const expansion = parseString(data.Expansion);
    validateId(data.Id, seenIds, name);

    // Required stuff first
    const baseCard: Partial<TrainingCard> = {
        Name: name,
        Type: "Training",
        TrainingType: parseString(data.TrainingType),
        Deck: deck,
        Primary: parseString(data.Deck),
        Text: parseText(data.Text),
        Expansion: parseString(data.Expansion),
        Art: parseString(data.Art),
        Artist: "Artist Name", // TODO: Pull from Art
        Serial: generateSerial(serials, deck, expansion),
    };

    if (!baseCard.Expansion?.length) {
        consola.warn(`No Expansion field defined for ${data.Name}`);
    }

    if (parseString(data.Flavor)) {
        baseCard.Flavor = parseText(data.Flavor);
    }

    // Validate it actually fits
    const cardData = validateTrainingCard(baseCard);
    return cardData;
}


export const convertTrainingCards = (talentCardPath: string, context: GenerationContext) => {
    checkInputPathExists(talentCardPath);

    consola.log(`Processing talent card data at ${talentCardPath}`);

    const fileData = fs.readFileSync(talentCardPath, { encoding: 'utf-8' });

    const records: RowData[] = parse(fileData, {
        columns: HEADERS,
        skip_empty_lines: true,
        from_line: 2, // Skip initial header
    });
    records.sort((a, b) => a.Id.localeCompare(b.Id));

    consola.log(`Found ${records.length} records`);

    let numFail = 0;
    let numTotal = 0;
    for (const record of records) {
        if (!shouldHandleRecord(record)) {
            continue;
        }
        numTotal++;
        const success = handleRecord(record, context);
        if (!success) {
            numFail++;
        }
    }

    if (numFail) {
        consola.fail(`Failed to convert ${numFail} rows out of ${numTotal} total`);
    } else {
        consola.success(`Successfully converted ${numTotal} rows to JSON`);
    }
}