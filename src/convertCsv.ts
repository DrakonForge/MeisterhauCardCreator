import { type ArmActionCard, type BaseCard, type Card, type LegActionCard } from "./types/card";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";
import { ActionTypeSchema, ParryHeightSchema, type Keyword, type ValueRange } from "./types/common";
import stringify from "json-stringify-pretty-compact";
import { validateCardFromJson } from './validation/validation';
import { checkInputPathExists, ensureOutputDirExists, main } from "./util/cliUtil";
import { consola } from "consola";

interface RowData {
    Id: string;
    Name: string;
    SecondaryName: string;
    ActionType: string;
    Category1: string;
    Category2: string;
    Tier: string;
    Packs: string;
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
    MetaType: string;
    Notes: string;
}

const HEADERS: (keyof RowData)[] = [
    "Id",
    "Name",
    "SecondaryName",
    "Tier",
    "Packs",
    "ActionType",
    "Category1",
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
    "MetaType",
    "Notes",
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

const REQUIRED_ARM_FIELDS: (keyof RowData)[] = [
    "Speed",
    "Structure",
    "ParryHeight",
    "Range"
];
const addArmActionData = (card: Partial<ArmActionCard>, data: RowData) => {
    if (!checkRequiredFields(data, REQUIRED_ARM_FIELDS)) {
        throw new Error("Missing required arm fields");
    }
    card.Speed = parseInt(data.Speed);
    card.Structure = parseInt(data.Structure);
    card.ParryHeight = ParryHeightSchema.parse(data.ParryHeight);
    card.Range = parseRange(data.Range);
    if (parseString(data.Keywords)) {
        card.Keywords = parseKeywords(data.Keywords);
    }
    if (parseString(data.DefendActionText)) {
        card.DefendAction = {
            Text: parseText(data.DefendActionText),
        }
        if (parseString(data.DefendActionTitle)) {
            card.DefendAction.Title = parseString(data.DefendActionTitle);
        }
    }
    if (parseString(data.ChamberActionText)) {
        card.ChamberAction = {
            Text: parseText(data.ChamberActionText),
        }
        if (parseString(data.ChamberActionTitle)) {
            card.ChamberAction.Title = parseString(data.ChamberActionTitle);
        }
    }
};

const REQUIRED_LEG_FIELDS: (keyof RowData)[] = [
    "Speed",
    "Range"
];
const addLegActionData = (card: Partial<LegActionCard>, data: RowData) => {
    if (!checkRequiredFields(data, REQUIRED_LEG_FIELDS)) {
        throw new Error("Missing required leg fields");
    }
    card.Speed = parseInt(data.Speed);
    card.Range = parseRange(data.Range);
    if (parseString(data.ChamberActionText)) {
        card.ChamberAction = {
            Text: parseText(data.ChamberActionText),
        }
        if (parseString(data.ChamberActionTitle)) {
            card.ChamberAction.Title = parseString(data.ChamberActionTitle);
        }
    }
}

// TODO: Behaviors
const REQUIRED_BASE_FIELDS: (keyof RowData)[] = [
    "Id",
    "Name",
    "Category1",
    "ActionType",
    "Tier",
    "ActionText",
];
const convertCsvToJson = (data: RowData): Card => {
    if (!checkRequiredFields(data, REQUIRED_BASE_FIELDS)) {
        throw new Error("Missing base fields");
    }
    // Required stuff first
    const baseCard: Partial<BaseCard> = {
        Name: parseString(data.Name),
        ActionType: ActionTypeSchema.parse(parseString(data.ActionType)),
        Tier: parseInt(data.Tier),
        Action: {
            Text: parseText(data.ActionText)
        }
    };

    // Optional
    if (parseString(data.SecondaryName)) {
        baseCard.SecondaryName = parseString(data.SecondaryName);
    }
    if (parseString(data.Category2)) {
        baseCard.Category = [parseString(data.Category1), parseString(data.Category2)];
    } else {
        baseCard.Category = parseString(data.Category1);
    }
    if (parseString(data.MetaType)) {
        const metaTypeStr = parseString(data.MetaType);
        if (metaTypeStr === "Token") {
            baseCard.MetaType = "Token";
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
    const cardData = validateCardFromJson(baseCard);
    return cardData;
}

const handleRecord = (record: RowData): boolean => {
    const id = parseString(record.Id);
    consola.debug(`Processing ${id}`);
    try {
        const jsonData = convertCsvToJson(record);
        const filePath = path.join("./generated/card_data", id + ".json");
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

const shouldHandleRecord = (record: RowData): boolean => {
    return !record.Notes.includes("IDEA");
}

const convertCsv = (inputPath: string, outputDir: string) => {
    checkInputPathExists(inputPath);

    consola.log(`Converting CSV at ${inputPath}`);

    const fileData = fs.readFileSync(inputPath, { encoding: 'utf-8' });

    const records: RowData[] = parse(fileData, {
        columns: HEADERS,
        skip_empty_lines: true,
        from_line: 2, // Skip initial header
    });

    consola.log(`Found ${records.length} records`);

    ensureOutputDirExists(outputDir);
    let numFail = 0;
    let numTotal = 0;
    for (const record of records) {
        if (!shouldHandleRecord(record)) {
            continue;
        }
        numTotal++;
        const success = handleRecord(record);
        if (!success) {
            numFail++;
        }
    }

    consola.info(`Results exported to ${outputDir}`);

    if (numFail) {
        consola.fail(`Failed to convert ${numFail} rows out of ${numTotal} total`);
    } else {
        consola.success(`Successfully converted ${numTotal} rows to JSON`);
    }
};

await main(async args => {
    const inputPath = args['input'] ?? "./test_data/data.csv";
    const outputDir = args['output'] ?? "./generated/card_data";
    convertCsv(inputPath, outputDir);
});
