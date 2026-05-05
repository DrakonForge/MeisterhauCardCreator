import { clearFolder, ensureOutputDirExists, main } from "./util/cliUtil";
import { convertActionCards } from "./convert/convertActionCards";
import { consola } from "consola";
import { convertTalentCards } from "./convert/convertTalentCards";
import { convertTrainingCards } from "./convert/convertTrainingCards";
import { readAndValidateFiles } from "./validation/parseFiles";
import { createHash } from "crypto";
import { generateDeckList, type DeckListEntry } from "./util/decklist";

const EMPTY_DIFF: Record<string, string> = {};

const getSnapshot = async (outputDir: string): Promise<Record<string, string>> => {
    const cardIdToHash: Record<string, string> = {};
    const cardList = await readAndValidateFiles(outputDir, false);
    for (const [key, card] of Object.entries(cardList)) {
        const hash = createHash('md5');
        const cardHash = hash.update(JSON.stringify(card)).digest("hex");
        cardIdToHash[key] = cardHash;
    }
    return cardIdToHash;
};

const compareDiffs = async (beforeSnapshot: Record<string, string>, afterSnapshot: Record<string, string>, changesDir: string) => {
    const added: Set<string> = new Set();
    const removed: Set<string> = new Set();
    const changed: Set<string> = new Set();
    const seen: Set<string> = new Set();

    for (const [key, hash] of Object.entries(beforeSnapshot)) {
        const otherHash = afterSnapshot[key];
        if (!otherHash) {
            removed.add(key);
        } else if (hash != otherHash) {
            changed.add(key);
        }
        seen.add(key);
    }

    for (const key of Object.keys(afterSnapshot)) {
        if (seen.has(key)) {
            continue;
        }
        added.add(key);
        seen.add(key);
    }

    consola.info("================================================");
    if (added.size || changed.size || removed.size) {
        consola.info(`CHANGES: ${added.size} added, ${changed.size} updated, ${removed.size} removed`);
    } else {
        consola.info(`CHANGES: None`)
    }
    consola.info("================================================");
    ensureOutputDirExists(changesDir);
    clearFolder(changesDir, false, ".txt");
    await generateDeckList("AddedOrUpdated", toDeckEntries(added.union(changed)), changesDir);
    await generateDeckList("Removed", toDeckEntries(removed), changesDir);
}

const toDeckEntries = (set: Set<string>): DeckListEntry[] => {
    const entries = [];
    for (const item of set) {
        entries.push({cardId: item, quantity: 1});
    }
    return entries;
}

const convertCsv = async (actionCardPath: string, talentCardPath: string, trainingCardPath: string, outputDir: string, changesDir: string, skipDiff: boolean) => {
    ensureOutputDirExists(outputDir);
    const beforeSnapshot = skipDiff ? EMPTY_DIFF : await getSnapshot(outputDir);
    clearFolder(outputDir, false, ".json");

    const seenIds = new Set<string>();
    convertActionCards(actionCardPath, outputDir, seenIds);
    convertTalentCards(talentCardPath, outputDir, seenIds);
    convertTrainingCards(trainingCardPath, outputDir, seenIds);

    consola.info(`Results exported to ${outputDir}`);

    const afterSnapshot = skipDiff ? EMPTY_DIFF : await getSnapshot(outputDir);
    if (!skipDiff) {
        await compareDiffs(beforeSnapshot, afterSnapshot, changesDir);
    }
};

await main(async args => {
    const actionCardPath = args['action'] ?? "./MeisterhauCardData/Data/Actions.csv";
    const talentCardPath = args['talent'] ?? "./MeisterhauCardData/Data/Talents.csv";
    const trainingCardPath = args['training'] ?? "./MeisterhauCardData/Data/Training.csv";
    const outputDir = args['output'] ?? "./generated/card_data";
    const changesDir = args['diff'] ?? "./generated/tracked_changes";
    const skipDiff = args['nodiff'] ?? false;
    await convertCsv(actionCardPath, talentCardPath, trainingCardPath, outputDir, changesDir, skipDiff);
});
