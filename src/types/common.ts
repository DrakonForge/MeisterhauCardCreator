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
    "Overbind",
    "Interrupt",
    "Disengage",
    // Guard
    "Volatile",
    "ProtectsHands"
]).meta({
    "id": "SimpleKeyword",
    "title": "Simple Keyword",
    "description": "Keywords that have no associated value."
});

const NumericKeywordTypeSchema = z.enum([
    // Attack
    "Swech",
    "Offline",
    // Guard
    "PointForward"
]).meta({
    "id": "NumericKeyword",
    "title": "Numeric Keyword",
    "description": "Keywords that must specify a value."
});

// Swiftness + Sterck are more shorthand effects than keywords

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

export const CategoriesSchema = z.union([z.string().nonempty(), z.array(z.string().nonempty()).nonempty()]).meta({
    "id": "Categories"
});

export const DirectionSchema = z.enum(["Forward", "Backward", "Any"]).meta({
    "id": "Direction"
});
export const StrikeSchema = z.enum(["Thrust", "Cut", "Oberhau", "Unterhau", "Mittlehau"]).meta({
    "id": "Strike"
});
export const ActionTypeSchema = z.enum(["Arm", "Leg", "Special"]).meta({
    "id": "ActionType"
});
export const ActionTypesSchema = z.union([ActionTypeSchema, z.array(ActionTypeSchema).nonempty()]);
export const TargetSchema = z.enum(["High", "Low"]).meta({
    "id": "Target"
});
export const ParryHeightSchema = z.enum(["High", "Low", "Both", "None"]).meta({
    "id": "ParryHeight"
});
export const GuardArchetypeSchema = z.enum(["Ochs", "Pflug", "VomTag", "Alber"]).meta({
    "id": "GuardArchetype",
    "title": "Guard Archetype",
    "description": "Which of the Vier Leger (core guards) this position would be classified as."
});
export const PlayerSchema = z.enum(["Self", "Opponent"]).meta({
    "id": "Player",
    "title": "Player",
    "description": "Self or Opponent"
});
export const StatSchema = z.enum(["Speed", "Structure"]).meta({
    "id": "Stat",
    "title": "Stat",
    "description": "Core stat of the card. Speed or Structure"
});
export const CardIdSchema = z.string().nonempty().describe("The ID of the card.");
export const GuardIdSchema = z.string().nonempty().describe("The ID of the guard.");
export const ArmActionTypeSchema = z.enum(["Normal", "Parry", "Defend", "Chamber"]).meta({
    "id": "ArmActionType"
});

export type Keyword = z.infer<typeof KeywordSchema>;
export type ValueRange = z.infer<typeof ValueRangeSchema>;
export type CardText = z.infer<typeof CardTextSchema>;
export type ActionType = z.infer<typeof ActionTypeSchema>;
