import { ensureOutputDirExists, main } from "./util/cliUtil";
import { convertActionCards } from "./convert/convertActionCards";
import { consola } from "consola";
import { convertTalentCards } from "./convert/convertTalentCards";
import { convertTrainingCards } from "./convert/convertTrainingCards";

const convertCsv = (actionCardPath: string, talentCardPath: string, trainingCardPath: string, outputDir: string) => {
    ensureOutputDirExists(outputDir);

    const seenIds = new Set<string>();
    convertActionCards(actionCardPath, outputDir, seenIds);
    convertTalentCards(talentCardPath, outputDir, seenIds);
    convertTrainingCards(trainingCardPath, outputDir, seenIds);

    consola.info(`Results exported to ${outputDir}`);
};

await main(async args => {
    const actionCardPath = args['action'] ?? "./MeisterhauCardData/Data/Actions.csv";
    const talentCardPath = args['talent'] ?? "./MeisterhauCardData/Data/Talents.csv";
    const trainingCardPath = args['training'] ?? "./MeisterhauCardData/Data/Training.csv";
    const outputDir = args['output'] ?? "./generated/card_data";
    convertCsv(actionCardPath, talentCardPath, trainingCardPath, outputDir);
});
