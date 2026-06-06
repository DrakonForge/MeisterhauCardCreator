import z from "zod";

export const ValueRangeSchema = z.union([
    z.int().nonnegative(),
    z.array(z.int().nonnegative()).length(2),
    z.object({
        Min: z.int().nonnegative().optional(),
        Max: z.int().nonnegative().optional(),
    })
]);

export const CardTextSchema = z.union([
    z.string().nonempty(),
    z.array(z.string().nonempty()).nonempty()
]);

// TODO: Validator should handle keywords that have no effect
const SimpleKeywordTypeSchema = z.enum([
    // Attack
    "Interrupt",
    "Disengage",
    "HandSnipe",
    "Vulnerable",
    // Guard
    "Volatile",
    "ProtectsHands",
    "Winden",
    "PointForward",
    "Guard",
    // Other
    "Token"
]).meta({
    "id": "SimpleKeyword",
    "title": "Simple Keyword",
    "description": "Keywords that have no associated value."
});

const NumericKeywordTypeSchema = z.enum([
    // Attack
    "Overbind",
    "Redirect",
    "Offline",
]).meta({
    "id": "NumericKeyword",
    "title": "Numeric Keyword",
    "description": "Keywords that must specify a value."
});

const KeywordSchema = z.union([
    z.object({
        Keyword: NumericKeywordTypeSchema,
        Value: z.int().nonnegative()
    }),
    SimpleKeywordTypeSchema,
]);
export const KeywordsSchema = z.array(KeywordSchema).nonempty().meta({
    "id": "Keywords"
});

export const ActionTypeSchema = z.enum(["Arm", "Leg", "Special"]).meta({
    "id": "ActionType"
});
export const DeckSchema = z.enum(["Audacity", "Celerity", "Fortitude", "Insight", "Footwork", "Fundamentals", "Training", "Token"]).meta({
    "id": "Deck"
});
export const ActionTypesSchema = z.union([ActionTypeSchema, z.array(ActionTypeSchema).nonempty()]);
export const ParryHeightSchema = z.enum(["High", "Low", "Both", "None"]).meta({
    "id": "ParryHeight"
});

export const CardTypeSchema = z.enum(["Action", "Talent", "Training"]);
export const TierSchema = z.int().min(0).max(3);

export type Keyword = z.infer<typeof KeywordSchema>;
export type ValueRange = z.infer<typeof ValueRangeSchema>;
export type CardText = z.infer<typeof CardTextSchema>;
export type ActionType = z.infer<typeof ActionTypeSchema>;
export type CardType = z.infer<typeof CardTypeSchema>;
export type Deck = z.infer<typeof DeckSchema>;
