import { readAndValidateFiles } from "./validation/parseFiles";

export const TEST_FOLDER = "./test_data";

// TODO: Make these CLI args

if (import.meta.main) {
    await readAndValidateFiles(TEST_FOLDER, true);
}
