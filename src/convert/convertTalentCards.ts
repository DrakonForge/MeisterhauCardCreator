import { consola } from "consola";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";
import stringify from "json-stringify-pretty-compact";
import { checkInputPathExists } from "../util/cliUtil";
import { parseString, parseText, validateId } from "./convertHelpers";
import type { TalentCard } from "../types/card";
import { validateTalentCard } from "../validation/validation";

interface RowData {
    Id: string;
    Name: string;
    Tier: string;
    Deck: string;
    Effect: string;
    Flavor: string;
    Expansion: string;
    Quantity: string;
    Art: string;
    Notes: string;
}

const HEADERS: (keyof RowData)[] = [
    "Id",
    "Name",
    "Tier",
    "Deck",
    "Effect",
    "Flavor",
    "Expansion",
    "Art",
    "Quantity",
    "Notes",
];

const REQUIRED_FIELDS: (keyof RowData)[] = [
    "Id",
    "Name",
    "Tier",
    "Deck",
    "Effect",
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

const handleRecord = (record: RowData, outputDir: string, seenIds: Set<string>): boolean => {
    const id = parseString(record.Id);
    consola.debug(`Processing ${id}`);
    try {
        const jsonData = convertCsvToJson(record, seenIds);
        const filePath = path.join(outputDir, id + ".json");
        fs.writeFileSync(filePath, stringify(jsonData, {
            indent: 4,
            maxLength: 50,
        }));
        consola.debug(`Generated ${id}.json`);
        return true;
    } catch (e) {
        consola.error(`Failed to validate card ${id}:`, e);
        return false;
    }
};

const convertCsvToJson = (data: RowData, seenIds: Set<string>): TalentCard => {
    const missingFields = checkRequiredFields(data, REQUIRED_FIELDS);
    if (missingFields.length) {
        throw new Error(`Missing required base fields: ${missingFields.join(', ')}`);
    }

    validateId(data.Id, seenIds);

    // Required stuff first
    const baseCard: Partial<TalentCard> = {
        Name: parseString(data.Name),
        Type: "Talent",
        Deck: parseString(data.Deck),
        Tier: parseInt(data.Tier),
        Effect: parseText(data.Effect),
        Quantity: 1,
        Expansion: parseString(data.Expansion),
        Art: parseString(data.Art),
        Artist: "Artist Name", // TODO: Pull from Art
        Serial: "X.5/100" //  TODO: Pull from global serial counts
    };

    if (!baseCard.Expansion?.length) {
        consola.warn(`No Expansion field defined for ${data.Name}, assuming Core`);
    }

    if (parseString(data.Quantity)) {
        baseCard.Quantity = parseInt(data.Quantity);
    }

    if (parseString(data.Flavor)) {
        baseCard.Flavor = parseText(data.Flavor);
    }

    // Validate it actually fits
    const cardData = validateTalentCard(baseCard);
    return cardData;
}


export const convertTalentCards = (talentCardPath: string, outputDir: string, seenIds: Set<string>) => {
    checkInputPathExists(talentCardPath);

    consola.log(`Processing talent card data at ${talentCardPath}`);

    const fileData = fs.readFileSync(talentCardPath, { encoding: 'utf-8' });

    const records: RowData[] = parse(fileData, {
        columns: HEADERS,
        skip_empty_lines: true,
        from_line: 2, // Skip initial header
    });

    consola.log(`Found ${records.length} records`);

    let numFail = 0;
    let numTotal = 0;
    for (const record of records) {
        if (!shouldHandleRecord(record)) {
            continue;
        }
        numTotal++;
        const success = handleRecord(record, outputDir, seenIds);
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