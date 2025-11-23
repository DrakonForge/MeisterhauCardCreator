import * as fs from 'fs';
import * as path from 'path';
import z from 'zod';
import { CardSchema } from './types/card';
import { ensureDirExists, main } from './util/cliUtil';

const createSchema = (outputDir: string) => {
    ensureDirExists(outputDir);
    const jsonSchema = z.toJSONSchema(CardSchema);
    const outputPath = path.join(outputDir, "CardSchema.json");
    fs.writeFileSync(outputPath, JSON.stringify(jsonSchema, undefined, 4));
    console.log("Schema generated");
};

await main(async args => {
    const outputDir = args['output'] ?? "./generated";
    createSchema(outputDir);
});