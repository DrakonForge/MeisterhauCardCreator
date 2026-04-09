import z from "zod";
import { ActionTypeSchema, CardTextSchema, CardTypeSchema, KeywordsSchema, ParryHeightSchema, TierSchema, ValueRangeSchema } from "./common";

const CardActionSchema = z.object({
    Title: z.string().nonempty().optional(),
    Text: CardTextSchema
});

const BaseCardSchema = z.object({
    Name: z.string().nonempty(),
    Type: CardTypeSchema,
    Flavor: CardTextSchema.optional(),
    Deck: z.string(),
    Quantity: z.number(),
    Expansion: z.string(),
});

const ActionBaseCardSchema = BaseCardSchema.extend({
    Type: z.literal("Action"),
    ActionType: ActionTypeSchema,
    Categories: z.array(z.string().nonempty()),
    SecondaryName: z.string().optional(),
    Action: CardActionSchema,
    ChamberAction: CardActionSchema.optional(),
    Keywords: KeywordsSchema.optional(),
    Speed: z.int().nonnegative().optional(),
    Tier: TierSchema,
})

const ArmLegActionCardSchema = ActionBaseCardSchema.extend({
    Speed: z.int().nonnegative(),
});

const ArmActionCardSchema = ArmLegActionCardSchema.extend({
    ActionType: z.literal("Arm"),
    Structure: z.int().nonnegative().optional(),
    ParryHeight: ParryHeightSchema,
    Range: ValueRangeSchema,
    Keywords: KeywordsSchema.optional(),
    DefendAction: CardActionSchema.optional(),
}).strict().meta({
    id: "ArmActionCard"
});

const LegActionCardSchema = ArmLegActionCardSchema.extend({
    ActionType: z.literal("Leg"),
}).strict().meta({
    id: "LegActionCard"
});

const SpecialActionCardSchema = ActionBaseCardSchema.extend({
    ActionType: z.literal("Special"),
    Speed: z.int().nonnegative().optional()
}).strict().meta({
    id: "SpecialActionCard"
});

const TalentCardSchema = BaseCardSchema.extend({
    Type: z.literal("Talent"),
    Effect: CardTextSchema,
    Tier: TierSchema,
});

const TrainingOptionSchema = z.object({
    Tier: TierSchema,
    Effect: CardTextSchema
})
const TrainingCardSchema = BaseCardSchema.extend({
    Type: z.literal("Training"),
    Options: TrainingOptionSchema.array().min(1)
});

export const ActionCardSchema = z.discriminatedUnion("ActionType", [
    ArmActionCardSchema,
    LegActionCardSchema,
    SpecialActionCardSchema,
])
export const CardSchema = z.discriminatedUnion("Type", [
    ActionCardSchema,
    TalentCardSchema,
    TrainingCardSchema
]).meta({
    id: "Card"
});

export type Card = z.infer<typeof CardSchema>;
export type BaseCard = z.infer<typeof BaseCardSchema>;
export type TalentCard = z.infer<typeof TalentCardSchema>;
export type TrainingCard = z.infer<typeof TrainingCardSchema>;
export type ActionCard = z.infer<typeof ActionBaseCardSchema>;
export type ArmActionCard = z.infer<typeof ArmActionCardSchema>;
export type LegActionCard = z.infer<typeof LegActionCardSchema>;
export type SpecialActionCard = z.infer<typeof SpecialActionCardSchema>;
export type CardAction = z.infer<typeof CardActionSchema>;
export type Keywords = z.infer<typeof KeywordsSchema>;