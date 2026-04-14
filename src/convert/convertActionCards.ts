import { type ActionCard, type ArmActionCard, type Card, type LegActionCard } from "../types/card";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";
import { ActionTypeSchema, ParryHeightSchema, type Keyword, type ValueRange } from "../types/common";
import stringify from "json-stringify-pretty-compact";
import { validateActionCard } from '../validation/validation';
import { checkInputPathExists, ensureOutputDirExists } from "../util/cliUtil";
import { consola } from "consola";

interface RowData {
    Id: string;
    Name: string;
    SecondaryName: string;
    ActionType: string;
    Category1: string;
    SubCategory1: string;
    Category2: string;
    SubCategory2: string;
    Tier: string;
    Deck: string;
    Speed: string;
    Structure: string;
    ParryHeight: string;
    Range: string;
    Keywords: string;
    ActionText: string;
    DefendActionTitle: string;
    DefendActionText: string;
    ChamberActionTitle: string;
    ChamberActionText: string;
    ActionBehavior: string;
    DefendActionBehavior: string;
    ChamberActionBehavior: string;
    Flavor: string;
    Expansion: string;
    Quantity: string;
    Art: string;
    Notes: string;
}

const HEADERS: (keyof RowData)[] = [
    "Id",
    "Name",
    "SecondaryName",
    "Tier",
    "Deck",
    "ActionType",
    "SubCategory1",
    "Category1",
    "SubCategory2",
    "Category2",
    "Speed",
    "Structure",
    "ParryHeight",
    "Range",
    "Keywords",
    "ActionText",
    "DefendActionTitle",
    "DefendActionText",
    "ChamberActionTitle",
    "ChamberActionText",
    "ActionBehavior",
    "DefendActionBehavior",
    "ChamberActionBehavior",
    "Flavor",
    "Expansion",
    "Art",
    "Quantity",
    "Notes",
];

const REQUIRED_BASE_FIELDS: (keyof RowData)[] = [
    "Id",
    "Name",
    "Category1",
    "ActionType",
    "Deck",
    "Tier",
    "ActionText",
    "Expansion"
];

const REQUIRED_ARM_FIELDS: (keyof RowData)[] = [
    "Speed",
    "ParryHeight",
    "Range"
];

const REQUIRED_LEG_FIELDS: (keyof RowData)[] = [
    "Speed"
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

const RANGE_SEPARATORS = ['-', '+', '..'];
const parseRange = (rangeStr: string): ValueRange => {
    for (const separator of RANGE_SEPARATORS) {
        if (rangeStr.includes(separator)) {
            const index = rangeStr.indexOf(separator);
            const before = rangeStr.substring(0, index);
            const after = rangeStr.substring(index + separator.length);
            if (!before && !after) {
                continue;
            }
            if (!before) {
                return {
                    Max: parseInt(after),
                };
            } else if (!after) {
                return {
                    Min: parseInt(before),
                };
            } else {
                return [parseInt(before), parseInt(after)];
            }
        }
    }
    const intValue = parseInt(rangeStr);
    if (!isNaN(intValue)) {
        return intValue;
    }
    throw new Error("Invalid range format");
};

const parseKeywords = (keywordsStr: string): Keyword[] => {
    const keywordList = keywordsStr.split(',').map(str => parseString(str)).filter(str => str);
    if (!keywordList.length) {
        throw new Error("Keywords cannot be empty");
    }
    const result: Keyword[] = [];
    for (const keywordStr of keywordList) {
        const lastSpaceIndex = keywordStr.lastIndexOf(' ');
        if (lastSpaceIndex > 0) {
            const keyword = keywordStr.substring(0, lastSpaceIndex);
            const modifier = parseInt(keywordStr.substring(lastSpaceIndex + 1));
            if (!isNaN(modifier)) {
                result.push({
                    Keyword: keyword,
                    Value: modifier,
                } as Keyword);
                continue;
            }
        }
        result.push(keywordStr as Keyword);
    }
    return result;
}

const parseText = (textStr: string): string | string[] => {
    const textLines = parseString(textStr).split('\n').map(str => parseString(str)).filter(str => str);
    if (!textLines.length) {
        throw new Error("Text cannot be empty");
    }
    if (textLines.length === 1) {
        return textLines[0] ?? '';
    }
    return textLines;
}

const parseString = (str: string): string => {
    str = str.trim();
    if (str.toLowerCase() === "x") {
        return '';
    }
    return str;
};


const addArmActionData = (card: Partial<ArmActionCard>, data: RowData) => {
    const missingFields = checkRequiredFields(data, REQUIRED_ARM_FIELDS);
    if (missingFields.length) {
        throw new Error(`Missing required arm fields: ${missingFields.join(', ')}`);
    }
    if (data.Structure) {
        card.Structure = parseInt(data.Structure);
    }
    card.ParryHeight = ParryHeightSchema.parse(data.ParryHeight);
    card.Range = parseRange(data.Range);
    if (parseString(data.DefendActionText)) {
        card.DefendAction = {
            Text: parseText(data.DefendActionText),
        }
        if (parseString(data.DefendActionTitle)) {
            card.DefendAction.Title = parseString(data.DefendActionTitle);
        }
    }
};

const addLegActionData = (card: Partial<LegActionCard>, data: RowData) => {
    const missingFields = checkRequiredFields(data, REQUIRED_LEG_FIELDS);
    if (missingFields.length) {
        throw new Error(`Missing required leg fields: ${missingFields.join(', ')}`);
    }
}


const convertCsvToJson = (data: RowData): ActionCard => {
    const missingFields = checkRequiredFields(data, REQUIRED_BASE_FIELDS);
    if (missingFields.length) {
        throw new Error(`Missing required base fields: ${missingFields.join(', ')}`);
    }

    validateId(data.Id);

    // TODO: Handle other card types
    // Required stuff first
    const baseCard: Partial<ActionCard> = {
        Name: parseString(data.Name),
        Type: "Action",
        Deck: parseString(data.Deck),
        ActionType: ActionTypeSchema.parse(parseString(data.ActionType)),
        Tier: parseInt(data.Tier),
        Action: {
            Text: parseText(data.ActionText)
        },
        Quantity: 1,
        Expansion: parseString(data.Expansion)
    };

    // TODO: Hard error on this later
    if (!baseCard.Expansion?.length) {
        consola.warn(`No Expansion field defined for ${data.Name}, assuming Core`);
    }

    if (parseString(data.Quantity)) {
        baseCard.Quantity = parseInt(data.Quantity);
    }

    if (parseString(data.Flavor)) {
        baseCard.Flavor = parseText(data.Flavor);
    }

    // Optional
    if (parseString(data.SecondaryName)) {
        baseCard.SecondaryName = parseString(data.SecondaryName);
    }
    baseCard.Categories = [];
    if (parseString(data.SubCategory1)) {
        baseCard.Categories.push(parseString(data.SubCategory1) + " " + parseString(data.Category1));
    } else {
        baseCard.Categories.push(parseString(data.Category1));
    }
    if (parseString(data.Category2)) {
        if (parseString(data.SubCategory2)) {
            baseCard.Categories.push(parseString(data.SubCategory2) + " " + parseString(data.Category2));
        } else {
            baseCard.Categories.push(parseString(data.Category2));
        }
    }
    if (baseCard.Categories.length <= 0) {
        throw new Error("Card must have at least one category");
    }

    if (parseString(data.Keywords)) {
        baseCard.Keywords = parseKeywords(data.Keywords);
    }

    if (parseInt(data.Speed)) {
        baseCard.Speed = parseInt(data.Speed);
    }

    if (parseString(data.ChamberActionText)) {
        baseCard.ChamberAction = {
            Text: parseText(data.ChamberActionText),
        }
        if (parseString(data.ChamberActionTitle)) {
            baseCard.ChamberAction.Title = parseString(data.ChamberActionTitle);
        }
    }

    if (data.ActionType === "Arm") {
        addArmActionData(baseCard as Partial<ArmActionCard>, data);
    } else if (data.ActionType === "Leg") {
        addLegActionData(baseCard as Partial<LegActionCard>, data);
    } else if (data.ActionType === "Special") {
        // All good, no extra fields currently
        // const specialActionCard = baseCard as Partial<SpecialActionCard>;
    } else {
        throw new Error(`Unhandled action type: ${data.ActionType}`);
    }

    // Validate it actually fits
    const cardData = validateActionCard(baseCard);
    return cardData;
}

const handleRecord = (record: RowData, outputDir: string): boolean => {
    const id = parseString(record.Id);
    consola.debug(`Processing ${id}`);
    try {
        const jsonData = convertCsvToJson(record);
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

const seenIds = new Set();
const validateId = (id: string): void => {
    if (id.includes(' ')) {
        throw new Error(`ID cannot include spaces: ${id}`)
    }
    if (seenIds.has(id)) {
        throw new Error(`Duplicate ID found: ${id}`)
    }
    seenIds.add(id);
}

const shouldHandleRecord = (record: RowData): boolean => {
    return !record.Notes.includes("IDEA");
}

export const convertActionCards = (actionCardPath: string, outputDir: string) => {
    checkInputPathExists(actionCardPath);

    consola.log(`Processing action card data at ${actionCardPath}`);

    const fileData = fs.readFileSync(actionCardPath, { encoding: 'utf-8' });

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
        const success = handleRecord(record, outputDir);
        if (!success) {
            numFail++;
        }
    }

    if (numFail) {
        consola.fail(`Failed to convert ${numFail} rows out of ${numTotal} total`);
    } else {
        consola.success(`Successfully converted ${numTotal} rows to JSON`);
    }
};