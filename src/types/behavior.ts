import z from "zod";
import { KeywordsSchema } from "./common";

const DefendAction = z.object({
    Action: z.literal("Defend"),
});

const GainKeywordsAction = z.object({
    Action: z.literal("GainKeywords"),
    Keywords: KeywordsSchema
});

const BehaviorActionSchema = z.discriminatedUnion("Action", [
    DefendAction
]);

export const BehaviorSchema = z.union([BehaviorActionSchema, z.array(BehaviorActionSchema)]);