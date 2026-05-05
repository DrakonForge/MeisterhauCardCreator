import { consola } from "consola";
import { clearFolder, main } from "./util/cliUtil";

const cleanAll = async (recursive: boolean) => {
    const tasks = [];
    tasks.push(clearFolder("./generated/card_data", recursive, ".json", true));
    tasks.push(clearFolder("./generated/card_images", recursive, ".png", true));
    tasks.push(clearFolder("./generated/deck_images", recursive, ".jpg", true));
    tasks.push(clearFolder("./generated/decklists", recursive, ".txt", true));
    tasks.push(clearFolder("./generated/tracked_changes", recursive, ".txt", true));
    await Promise.all(tasks);
    consola.success("Cleared all generated data.");
};

await main(async args => {
    const recursive = args['r'] ?? false;
    await cleanAll(recursive);
});
