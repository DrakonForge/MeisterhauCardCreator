import z from "zod";

export const RangeSchema = z.union([
    z.int().nonnegative(),
    z.array(z.int().nonnegative()).length(2),
]);

export const KeywordTypeSchema = z.enum([]);
export const KeywordSchema = z.union([
    z.object({
        Keyword: KeywordTypeSchema,
        Value: z.int().nonnegative()
    }),
    KeywordTypeSchema
]);
export const KeywordsSchema = z.union([KeywordSchema, z.array(KeywordSchema).min(1)]);

export const DirectionSchema = z.enum(["Forward", "Backward", "Any"]);
export const StrikeSchema = z.enum(["Thrust", "Cut", "Oberhau", "Unterhau", "Mittlehau"]);
export const ActionTypeSchema = z.enum(["Arm", "Leg", "Special"]);
export const TargetSchema = z.enum(["High", "Low"]);
export const ParryHeightSchema = z.enum(["High", "Low", "Both", "None"]);

