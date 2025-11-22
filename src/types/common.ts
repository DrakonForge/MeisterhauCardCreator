import z from "zod";

export const ValueRangeSchema = z.union([
    z.int().nonnegative(),
    z.array(z.int().nonnegative()).length(2),
    z.object({
        Min: z.int().nonnegative().optional(),
        Max: z.int().nonnegative().optional(),
    })
]);

const AttackKeywordTypeSchema = z.enum([
    "Overbind",
    "Sterck",
    "Swech",
    "Offline",
    "Interrupt",
    "Disengage",
]);

const GuardKeywordTypeSchema = z.enum([
    "PointForward",
    "ProtectsHands",
    "Volatile"
]);

const GeneralKeywordTypeSchema = z.enum([
    "Swiftness"
]);

export const KeywordTypeSchema = z.union([AttackKeywordTypeSchema, GuardKeywordTypeSchema, GeneralKeywordTypeSchema]);
export const KeywordSchema = z.union([
    z.object({
        Keyword: KeywordTypeSchema,
        Value: z.int().nonnegative()
    }),
    KeywordTypeSchema
]);

export const KeywordsSchema = z.union([KeywordSchema, z.array(KeywordSchema).nonempty()]);

export const CategoriesSchema = z.union([z.string().nonempty(), z.array(z.string().nonempty()).nonempty()])

export const DirectionSchema = z.enum(["Forward", "Backward", "Any"]);
export const StrikeSchema = z.enum(["Thrust", "Cut", "Oberhau", "Unterhau", "Mittlehau"]);
export const ActionTypeSchema = z.enum(["Arm", "Leg", "Special"]);
export const ActionTypesSchema = z.union([ActionTypeSchema, z.array(ActionTypeSchema).nonempty()]);
export const TargetSchema = z.enum(["High", "Low"]);
export const ParryHeightSchema = z.enum(["High", "Low", "Both", "None"]);
// Guard Classification Theory: All guards can be categorized into one of these four
export const GuardArchetypeSchema = z.enum(["Ochs", "Plow", "VomTag", "Alber"]);
export const PlayerSchema = z.enum(["Self", "Opponent"]);
export const StatSchema = z.enum(["Speed", "Structure"]);
export const CardIdSchema = z.string().nonempty();
export const GuardIdSchema = z.string().nonempty();
export const ArmActionTypeSchema = z.enum(["Normal", "Parry", "Defend", "Chamber"]);
