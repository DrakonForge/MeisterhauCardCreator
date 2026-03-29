import z from "zod";
import { ActionTypeSchema, CardTextSchema, KeywordsSchema, ParryHeightSchema, ValueRangeSchema } from "./common";

const CardActionSchema = z.object({
    Title: z.string().nonempty().optional(),
    Text: CardTextSchema
});

const BaseCardSchema = z.object({
    Name: z.string().nonempty().describe("The name of the card."),
    Type: z.enum(["Action", "Talent"]),
    Tier: z.int().min(0).max(3),
});

const ActionBaseCardSchema = BaseCardSchema.extend({
    Type: z.literal("Action"),
    ActionType: ActionTypeSchema,
    Deck: z.string(),
    Categories: z.array(z.string().nonempty()),
    SecondaryName: z.string().optional(),
    Action: CardActionSchema,
    ChamberAction: CardActionSchema.optional(),
    Keywords: KeywordsSchema.optional(),
    Speed: z.int().nonnegative().optional(),
})

const ArmLegActionCardSchema = ActionBaseCardSchema.extend({
    Speed: z.int().nonnegative(),
    Range: ValueRangeSchema,
});

// TODO: Guards should be JSON-driven but stored separately.

const ArmActionCardSchema = ArmLegActionCardSchema.extend({
    ActionType: z.literal("Arm"),
    Structure: z.int().nonnegative(),
    ParryHeight: ParryHeightSchema,
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
    Deck: z.string(),
    Effect: CardTextSchema,
});

export const ActionCardSchema = z.discriminatedUnion("ActionType", [
    ArmActionCardSchema,
    LegActionCardSchema,
    SpecialActionCardSchema,
])
export const CardSchema = z.discriminatedUnion("Type", [
    ActionCardSchema,
    TalentCardSchema
]).meta({
    id: "Card"
});

export type Card = z.infer<typeof CardSchema>;
export type BaseCard = z.infer<typeof BaseCardSchema>;
export type ActionCard = z.infer<typeof ActionBaseCardSchema>;
export type ArmActionCard = z.infer<typeof ArmActionCardSchema>;
export type LegActionCard = z.infer<typeof LegActionCardSchema>;
export type SpecialActionCard = z.infer<typeof SpecialActionCardSchema>;
export type CardAction = z.infer<typeof CardActionSchema>;
export type Keywords = z.infer<typeof KeywordsSchema>;