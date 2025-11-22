import { CardSchema, type ArmActionCard, type BaseCard, type Card, type LegActionCard, type SpecialActionCard } from "./types/card";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";
import { ActionTypeSchema, ParryHeightSchema, type Keyword, type ValueRange } from "./types/common";
import stringify from "json-stringify-pretty-compact";

const INPUT_PATH = "./test_data/data.csv";
const OUTPUT_DIR = "./generated/card_data";

interface RowData {
    Id: string;
    Name: string;
    SecondaryName: string;
    ActionType: string;
    Category1: string;
    Category2: string;
    Tier: string;
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
    Notes: string;
}

const HEADERS: (keyof RowData)[] = [
    "Id",
    "Name",
    "SecondaryName",
    "ActionType",
    "Category1",
    "Category2",
    "Tier",
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
    "Notes",
];

const REQUIRED_BASE_FIELDS: (keyof RowData)[] = [
    "Id",
    "Name",
    "Category1",
    "ActionType",
    "Tier",
    "ActionText",
];

const REQUIRED_ARM_FIELDS: (keyof RowData)[] = [
    "Speed",
    "Structure",
    "ParryHeight",
    "Range"
];

const REQUIRED_LEG_FIELDS: (keyof RowData)[] = [
    "Speed",
];

const checkRequiredFields = (data: RowData, requiredFields: (keyof RowData)[]) => {
    for (const field of requiredFields) {
        if (!data[field]) {
            return false;
        }
    }
    return true;
};

const RANGE_SEPARATORS = [ '-', '+', '..' ];
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
    const keywordList = keywordsStr.split(',').map(str => str.trim()).filter(str => str);
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
    const textLines = textStr.trim().split('\n').map(str => str.trim()).filter(str => str);
    if (!textLines.length) {
        throw new Error("Text cannot be empty");
    }
    if (textLines.length === 1) {
        return textLines[0] ?? '';
    }
    return textLines;
}

// TODO: Behaviors
const convertCsvToJson = (data: RowData): Card => {
    if (!checkRequiredFields(data, REQUIRED_BASE_FIELDS)) {
        throw new Error("Missing base fields");
    }
    // Required stuff first
    const baseCard: Partial<BaseCard> = {
        Name: data.Name,
        ActionType: ActionTypeSchema.parse(data.ActionType),
        Tier: parseInt(data.Tier),
        Action: {
            Text: parseText(data.ActionText)
        }
    };

    // Optional
    if (data.SecondaryName) {
        baseCard.SecondaryName = data.SecondaryName;
    }
    if (data.Category2) {
        baseCard.Category = [data.Category1, data.Category2];
    } else {
        baseCard.Category = data.Category1;
    }

    if (data.ActionType === "Arm") {
        if (!checkRequiredFields(data, REQUIRED_ARM_FIELDS)) {
            throw new Error("Missing required arm fields");
        }
        const armActionCard = baseCard as Partial<ArmActionCard>;
        armActionCard.Speed = parseInt(data.Speed);
        armActionCard.Structure = parseInt(data.Structure);
        armActionCard.ParryHeight = ParryHeightSchema.parse(data.ParryHeight);
        armActionCard.Range = parseRange(data.Range);
        if (data.Keywords) {
            armActionCard.Keywords = parseKeywords(data.Keywords);
        }
        if (data.DefendActionText) {
            armActionCard.DefendAction = {
                Text: parseText(data.DefendActionText),
            }
            if (data.DefendActionTitle) {
                armActionCard.DefendAction.Title = data.DefendActionTitle;
            }
        }
        if (data.ChamberActionText) {
            armActionCard.ChamberAction = {
                Text: parseText(data.ChamberActionText),
            }
            if (data.ChamberActionTitle) {
                armActionCard.ChamberAction.Title = data.ChamberActionTitle;
            }
        }
    } else if (data.ActionType === "Leg") {
        if (!checkRequiredFields(data, REQUIRED_LEG_FIELDS)) {
            throw new Error("Missing required leg fields");
        }
        const legActionCard = baseCard as Partial<LegActionCard>;
        legActionCard.Speed = parseInt(data.Speed);
        if (data.ChamberActionText) {
            legActionCard.ChamberAction = {
                Text: parseText(data.ChamberActionText),
            }
            if (data.ChamberActionTitle) {
                legActionCard.ChamberAction.Title = data.ChamberActionTitle;
            }
        }
    } else if (data.ActionType === "Special") {
        // All good, no extra fields currently
        // const specialActionCard = baseCard as Partial<SpecialActionCard>;
    } else {
        throw new Error(`Unhandled action type: ${data.ActionType}`);
    }

    // Validate it actually fits
    const cardData = CardSchema.parse(baseCard);
    return cardData;
}

const handleRecord = (record: RowData): boolean => {
    const id = record.Id;
    // console.debug(`Processing ${id}`);
    try {
        const jsonData = convertCsvToJson(record);
        const filePath = path.join(OUTPUT_DIR, id + ".json");
        fs.writeFileSync(filePath, stringify(jsonData, {
            indent: 4,
            maxLength: 50,
        }));
        console.debug(`Generated ${id}.json`);
        return true;
    } catch (e) {
        console.warn(`Failed to validate card ${id}`, e);
        return false;
    }
};


const convertCsv = () => {
    if (!fs.existsSync(INPUT_PATH)) {
        console.error("Unable to find file");
        return;
    }

    const fileData = fs.readFileSync(INPUT_PATH, { encoding: 'utf-8' });

    const records: RowData[] = parse(fileData, {
        columns: HEADERS,
        skip_empty_lines: true,
        from_line: 2, // Skip initial header
    });

    console.log(`Found ${records.length} records`);

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR);
    }

    let numFail = 0;
    for (const record of records) {
        const success = handleRecord(record);
        if (!success) {
            numFail++;
        }
    }
    console.log(`${numFail} rows failed to validate out of ${records.length} total`);
};

convertCsv();