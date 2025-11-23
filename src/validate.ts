import { readAndValidateFiles } from "./validation/parseFiles";

export const TEST_FOLDER = "./test_data";

// TODO: Make these CLI args
await readAndValidateFiles(TEST_FOLDER, true);
