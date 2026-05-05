import minimist from "minimist";
import * as fs from "fs";
import { consola } from "consola";
import path from "path";

export const main = async (callback: (args: minimist.ParsedArgs) => Promise<void>) => {
    if (import.meta.main) {
        const args = minimist(process.argv.slice(2));

        const verbose = args['v'];
        if (verbose) {
            consola.level = 4; // Enables debug logs
        }

        const startTime = performance.now();
        try {
            await callback(args);
        } catch (error) {
            consola.error(error)
        }
        const endTime = performance.now();
        consola.info(`Finished task in ${Math.ceil(endTime - startTime)}ms`);
    }
};

export const ensureOutputDirExists = (path: string) => {
    if (!fs.existsSync(path)) {
        consola.log(`Creating ${path} since it does not exist`);
        fs.mkdirSync(path, { recursive: true });
    }
};

export const checkInputPathExists = (path: string) => {
    if (!fs.existsSync(path)) {
        throw new Error(`Unable to find input path: ${path}`);
    }
};

export const clearFolder = (dirPath: string, recursive: boolean, suffix: string, removeFolder: boolean = false) => {
    if (!fs.existsSync(dirPath)) {
        if (removeFolder) {
            consola.debug(`Folder already removed: ${dirPath}`);
        } else {
            consola.warn(`No folder exists to clear: ${dirPath}`);
        }
        return;
    }
    const contents = fs.readdirSync(dirPath);
    for (const filePath of contents) {
        const fullPath = path.join(dirPath, filePath);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (!recursive) {
                continue;
            }
            // Sub-directory
            clearFolder(fullPath, recursive, suffix);
            fs.rmdirSync(fullPath);
        } else if (filePath.endsWith(suffix)) {
            fs.unlinkSync(fullPath);
        }
    }
    if (removeFolder) {
        fs.rmdirSync(dirPath);
    }
}

export const createProgressBar = (progress: number, barWidth = 10) => {
    const filledWidth = Math.floor(progress * barWidth);
    const emptyWidth = barWidth - filledWidth;
    const progressBar = '='.repeat(filledWidth) + '-'.repeat(emptyWidth);
    return `[${progressBar}]`;
}
