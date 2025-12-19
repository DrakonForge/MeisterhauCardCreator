import { readdir } from "fs/promises";
import { consola } from "consola";
import path from "path";

export const createCardIdToPath = async (imageDir: string, recursive: boolean): Promise<Record<string, string> | null> => {
    const cardIdToPath: Record<string, string> = {};
    let imageFiles: string[]
    try {
        imageFiles = await readdir(imageDir, { recursive });
    } catch (e) {
        consola.error("Error encountered while reading image files", e);
        return null;
    }

    for (const file of imageFiles) {
        if (!file.endsWith(".png")) {
            continue;
        }
        const cardId = file.substring(0, file.length - ".png".length);
        const imagePath = path.join(imageDir, file);
        cardIdToPath[cardId] = imagePath;
    }

    return cardIdToPath;
}
