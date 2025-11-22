import z from "zod";
import { CardSchema } from "./types/card";

const jsonSchema = z.toJSONSchema(CardSchema);
console.log(JSON.stringify(jsonSchema));