import * as fs from 'fs';
import * as path from 'path';
import z from 'zod';
import { CardSchema } from './types/card';

const OUTPUT_FOLDER = "generated";
const OUTPUT_PATH = path.join(OUTPUT_FOLDER, "CardSchema.json");

const jsonSchema = z.toJSONSchema(CardSchema);
if (!fs.existsSync(OUTPUT_FOLDER)) {
    fs.mkdirSync(OUTPUT_FOLDER);
}
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(jsonSchema, undefined, 4));
console.log("Schema generated");