import { ensureOutputDirExists, main } from "./util/cliUtil";
import { convertActionCards } from "./convert/convertActionCards";
import { consola } from "consola";
import { convertTalentCards } from "./convert/convertTalentCards";
import { convertTrainingCards } from "./convert/convertTrainingCards";

const convertCsv = (actionCardPath: string, talentCardPath: string, trainingCardPath: string, outputDir: string) => {
    ensureOutputDirExists(outputDir);

    convertActionCards(actionCardPath, outputDir);
    convertTalentCards(talentCardPath, outputDir);
    convertTrainingCards(trainingCardPath, outputDir);

    consola.info(`Results exported to ${outputDir}`);
};

await main(async args => {
    const actionCardPath = args['action'] ?? "./MeisterhauCardData/data.csv";
    const talentCardPath = args['talent'] ?? "./MeisterhauCardData/talents.csv";
    const trainingCardPath = args['training'] ?? "./MeisterhauCardData/training.csv";
    const outputDir = args['output'] ?? "./generated/card_data";
    convertCsv(actionCardPath, talentCardPath, trainingCardPath, outputDir);
});
