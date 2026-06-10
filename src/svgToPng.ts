import { checkInputPathExists, ensureOutputDirExists, main } from "./util/cliUtil";
import { consola } from "consola";
import path from "path";
import sharp from "sharp";
import { readdir } from "fs/promises";

const scaleMultiplier = 1;
const baseDensity = 72;
const svgToPng = async (imageDir: string, outputDir: string, recursive: boolean): Promise<void> => {
    checkInputPathExists(imageDir);
    ensureOutputDirExists(outputDir);

    let imageFiles: string[] = await readdir(imageDir, { recursive });
    const tasks = [];
    let numConverted = 0;
    for (const file of imageFiles) {
        if (!file.endsWith(".svg")) {
            continue;
        }
        const fileName = file.substring(0, file.length - ".svg".length);
        const imagePath = path.join(imageDir, file);
        const outputPath = path.join(outputDir, `${fileName}.png`);
        const image = sharp(imagePath);
        const metadata = await image.metadata();
        const targetWidth = Math.round(metadata.width * scaleMultiplier);
        const targetHeight = Math.round(metadata.height * scaleMultiplier);
        const density = baseDensity * scaleMultiplier;
        tasks.push(sharp(imagePath, {density}).resize(targetWidth, targetHeight).png().toFile(outputPath));
        numConverted += 1;
    }
    await Promise.all(tasks);

    consola.success(`Successfully converted ${numConverted} SVG files to PNG at ${outputDir}`);
}

await main(async args => {
    const imageDir = args['images'] ?? "./public/img";
    const outputDir = args['output'] ?? "./generated/svgtopng";
    const recursive = args['r'] ?? false;
    await svgToPng(imageDir, outputDir, recursive);
});