import { readAndValidateFiles } from "./validation/parseFiles";
import { main } from "./util/cliUtil";

await main(async args => {
    const inputDir = args['input'] ?? "./generated/card_data";
    const recursive = args['r'] ?? false;
    await readAndValidateFiles(inputDir, recursive);
});
