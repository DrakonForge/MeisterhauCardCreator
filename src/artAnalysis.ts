import * as fs from "fs";
import { clearFolder, ensureOutputDirExists, main } from "./util/cliUtil";
import { consola } from "consola";
import { readAndValidateFiles } from "./validation/parseFiles";
import type { Card } from "./types/card";
import { MarkdownDocument, md } from "build-md";
import path from "path";

/**
 * Each doc entry shall consist of at least two blocks separated by two newlines.
 * The first block shall have the metadata, which is regenerated every run
 * The second block shall have the manual info, which is retained from the previous version
 *
 * They shall be separated by headers containing the ID of the card, as well as other organizing markers
 */

// https://www.npmjs.com/package/build-md#-quickstart

const DOC_NAME = "ArtSpec.md";
const REMOVED_TAG = " (REMOVED)";
const BACKUP_DIR = "Backup";
const HEADER = "## ";
const PLACEHOLDER_DESCRIPTION = "TODO - Missing Entry";
const runArtAnalysis = async (inputDir: string, outputDir: string, includeExpansions: string[], recursive: boolean): Promise<void> => {
    ensureOutputDirExists(outputDir);
    ensureOutputDirExists(path.join(outputDir, BACKUP_DIR));
    clearFolder(outputDir, recursive, ".txt");
    const cardList = await readAndValidateFiles(inputDir, recursive);
    const cardsByArtId = getCardsByArtId(cardList, includeExpansions);

    const artIds = Object.keys(cardsByArtId).sort();

    const outputDocPath = path.join(outputDir, DOC_NAME);
    const existingDocEntries = readExistingDoc(outputDocPath);
    const needToRetain = new Set(Object.keys(existingDocEntries));
    const dateStr = new Date().toLocaleDateString();
    const outputDocument = new MarkdownDocument({ mutable: true })
        .heading(1, "Art Spec")
        .list([
            `Last generated: ${dateStr}`,
            `Total unique card arts: ${artIds.length}`
        ]);
    let todoCounts = 0;

    consola.log(`Found ${Object.keys(cardsByArtId).length} unique card arts with ${needToRetain.size} existing entries`);

    for (const artId of artIds) {
        consola.debug(`Processing ${artId}`);
        const cardIds = cardsByArtId[artId];
        if (cardIds == null) {
            consola.error(`Failed to find cards for ${artId}`);
            continue;
        }
        const metadata = generateMetadata(cardList, cardIds);
        let description = PLACEHOLDER_DESCRIPTION;
        let header = artId;
        if (existingDocEntries[artId] != null && existingDocEntries[artId].length) {
            description = existingDocEntries[artId];
        }
        if (description.includes("TODO")) {
            todoCounts += 1;
            header += " (TODO)";
        }
        outputDocument.heading(2, header).list(metadata).paragraph(description);
        needToRetain.delete(artId);
    }

    if (needToRetain.size) {
        // Add to removed section
        for (const removedArtId of needToRetain) {
            const existingEntry = existingDocEntries[removedArtId];
            if (existingEntry == null) {
                consola.error(`Failed to find entry for removed art ${removedArtId}`);
                continue;
            }
            let name = removedArtId;
            if (!name.endsWith(REMOVED_TAG)) {
                name += REMOVED_TAG;
            }
            outputDocument.heading(2, name).paragraph(existingEntry);
        }
        consola.log(`Found ${needToRetain.size} removed entries`);
    }

    consola.warn(`${todoCounts} TODOs are still pending. Completion: ${artIds.length - todoCounts}/${artIds.length} (${Math.round((artIds.length - todoCounts) / artIds.length * 100 * 100) / 100}%)`);
    consola.success(`Writing document to ${outputDocPath}`);
    fs.writeFileSync(outputDocPath, outputDocument.toString());
    const backupDocPath = path.join(outputDir, BACKUP_DIR, `ArtSpec_${dateStr.replaceAll("/", "_")}.md`);
    fs.writeFileSync(backupDocPath, outputDocument.toString());
    consola.success(`Writing backup to ${outputDocPath}`);
}

const generateMetadata = (cardList: Record<string, Card>, cardIds: string[]): any[] => {
    // Sort by shortest ID first
    if (cardIds.length > 1) {
        cardIds.sort((a, b) => a.length - b.length);
    }

    const firstCardId = cardIds[0] ?? "";
    const firstCard = cardList[firstCardId];
    if (firstCard == null) {
        throw new Error(`Failed to find card data for ${firstCardId}`)
    }

    let typeInfo = firstCard.Type;
    if (firstCard.Type === "Action") {
        const categoryStrings: string[] = [];
        for (const category of firstCard.Categories) {
            categoryStrings.push(category);
        }
        typeInfo += ` (${categoryStrings.join(" - ")})`;
    }
    if (firstCard.Type === "Training") {
        typeInfo += ` (${firstCard.TrainingType})`;
    }

    let cardName = firstCard.Name;
    if (firstCard.Type === "Action") {
        if (firstCard.SecondaryName) {
            cardName += ` (${firstCard.SecondaryName})`
        }
    }
    const metadata: any[] = [
        md`${md.bold(`Card ID${cardIds.length > 1 ? `s (${cardIds.length})` : ""}`)}: ${cardIds.join(", ")}`,
        md`${md.bold(`Type`)}: ${typeInfo}`,
        md`${md.bold(`Name`)}: ${cardName}`,
    ];
    return metadata;
}

const readExistingDoc = (outputDocPath: string): Record<string, string> => {
    const existingDocEntries: Record<string, string> = {};
    const fileContents = fs.readFileSync(outputDocPath, "utf-8");
    const lines = fileContents.split(/\r?\n/).map(line => line.trim());

    let lineIndex = findNextEntryIndex(lines, 0);
    let nextLineIndex = -1;
    while (lineIndex < lines.length) {
        let artId = lines[lineIndex]?.substring(HEADER.length)?.split(' ')[0];
        if (artId == null) {
            consola.warn(`Failed to read header at line ${lineIndex}`);
            continue;
        }
        nextLineIndex = findNextEntryIndex(lines, lineIndex + 1);
        let start = lineIndex + 1;
        let end = nextLineIndex - 1;
        while (start < nextLineIndex && lines[start] != null && (!lines[start]?.length || lines[start]?.startsWith("- "))) {
            start += 1;
        }
        while (end >= lineIndex && lines[end] != null && !lines[end]?.length) {
            end -= 1;
        }
        const entryLines = lines.slice(start, end + 1);
        const concatenated = entryLines.join("\n");
        if (concatenated != PLACEHOLDER_DESCRIPTION) {
            existingDocEntries[artId] = entryLines.join("\n");
        }
        lineIndex = nextLineIndex;
    };

    return existingDocEntries;
}

const findNextEntryIndex = (lines: string[], lineIndex: number): number => {
    while (lineIndex < lines.length && !lines[lineIndex]?.startsWith(HEADER)) {
        lineIndex += 1;
    }
    return lineIndex;
}


const getCardsByArtId = (cardList: Record<string, Card>, includeExpansions: string[]): Record<string, string[]> => {
    const cardsByArtId: Record<string, string[]> = {};

    if (includeExpansions.length) {
        consola.info(`Including only expansions: ${includeExpansions}`);
    }

    for (const [cardId, card] of Object.entries(cardList)) {
        if (includeExpansions.length) {
            if (!includeExpansions.includes(card.Expansion)) {
                continue;
            }
        }
        const artId = card.Art;
        if (!cardsByArtId[artId]) {
            cardsByArtId[artId] = [];
        }
        cardsByArtId[artId].push(cardId);
    }

    return cardsByArtId;
}

await main(async args => {
    const inputDir = args['input'] ?? "./generated/card_data";
    const outputDir = args['output'] ?? "./MeisterhauCardData/ArtSpec";
    const recursive = args['r'] ?? false;
    args['expansion'] = args['expansion'] ?? args['exp'] ?? args['e'];
    const includeExpansions = args['expansion'] ? args['expansion'].split(',') : ["Core", "Starter"]; // Default to Core

    await runArtAnalysis(inputDir, outputDir, includeExpansions, recursive);
});