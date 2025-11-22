import z from "zod";
import { ConditionsSchema } from "./condition";
import { BehaviorSchema } from "./behavior";
import { ActionTypeSchema, KeywordsSchema, ParryHeightSchema, ValueRangeSchema } from "./common";

const CardActionSchema = z.object({
    Title: z.string().nonempty().optional(),
    Text: z.union([
        z.string().nonempty(),
        z.array(z.string().nonempty()).nonempty()
    ]),
    // Optional for now, since we do not need the logic yet
    Conditions: ConditionsSchema.optional(),
    Behavior: BehaviorSchema.optional(),
});


const BaseCardSchema = z.object({
    Name: z.string().nonempty().describe("The name of the card."),
    SecondaryName: z.string().optional(),
    ActionType: ActionTypeSchema,
    Category: z.union([
        z.string().nonempty(),
        z.array(z.string().nonempty()).min(1).max(2),
    ]),
    Tier: z.int().min(0).max(3),
    Action: CardActionSchema,
});

const ArmLegActionCardSchema = BaseCardSchema.extend({
    Speed: z.int().nonnegative(),
    ChamberAction: CardActionSchema.optional(),
});

// TODO: Guards should be JSON-driven but stored separately.

const ArmActionCardSchema = ArmLegActionCardSchema.extend({
    ActionType: z.literal("Arm"),
    Structure: z.int().nonnegative(),
    ParryHeight: ParryHeightSchema,
    Range: ValueRangeSchema,
    // Right now, only arm actions have keywords
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

const SpecialActionCardSchema = BaseCardSchema.extend({
    ActionType: z.literal("Special"),
}).strict().meta({
    id: "SpecialActionCard"
});

export const CardSchema = z.discriminatedUnion("ActionType", [
    ArmActionCardSchema,
    LegActionCardSchema,
    SpecialActionCardSchema
]).meta({
    id: "Card"
});

export type Card = z.infer<typeof CardSchema>;
export type BaseCard = z.infer<typeof BaseCardSchema>;
export type ArmActionCard = z.infer<typeof ArmActionCardSchema>;
export type LegActionCard = z.infer<typeof LegActionCardSchema>;
export type SpecialActionCard = z.infer<typeof SpecialActionCardSchema>;