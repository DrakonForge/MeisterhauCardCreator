import * as fs from 'fs';
import * as path from 'path';
import z from 'zod';
import { CardSchema } from './types/card';
import { ensureOutputDirExists, main } from './util/cliUtil';
import { consola } from 'consola';

const createSchema = (outputDir: string) => {
    ensureOutputDirExists(outputDir);
    const jsonSchema = z.toJSONSchema(CardSchema);
    const outputPath = path.join(outputDir, "CardSchema.json");
    fs.writeFileSync(outputPath, JSON.stringify(jsonSchema, undefined, 4));
    consola.success(`Successfully generated card schema at ${outputPath}`);
};

await main(async args => {
    const outputDir = args['output'] ?? "./generated";
    createSchema(outputDir);
});