import minimist from "minimist";
import * as fs from "fs";

export const main = async (callback: (args: minimist.ParsedArgs) => Promise<void>) => {
    if (import.meta.main) {
        const args = minimist(process.argv.slice(2));
        await callback(args);
    }
}

export const ensureDirExists = (path: string) => {
    if (!fs.existsSync(path)) {
        console.log(`Creating ${path} since it does not exist`);
        fs.mkdirSync(path);
    }
};
export const delay = (time: number) => {
    return new Promise(function (resolve) {
        setTimeout(resolve, time);
    });
};
