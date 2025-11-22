import z from "zod";
import { ConditionsSchema } from "./condition";
import { BehaviorSchema } from "./behavior";
import { ActionTypeSchema, ParryHeightSchema, ValueRangeSchema } from "./common";

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
    Name: z.string().nonempty(),
    SecondaryName: z.string().optional(),
    ActionType: ActionTypeSchema,
    Category: z.union([
        z.string().nonempty(),
        z.array(z.string().nonempty()).min(1).max(2),
    ]),
    Tier: z.int().min(0).max(3),
    Action: CardActionSchema,
});

// TODO: Guards should be JSON-driven but stored separately.

const ArmActionCardSchema = BaseCardSchema.extend({
    ActionType: z.literal("Arm"),
    Speed: z.int().nonnegative(),
    Structure: z.int().nonnegative(),
    ParryHeight: ParryHeightSchema,
    Range: ValueRangeSchema,
    DefendAction: CardActionSchema,
    ChamberAction: CardActionSchema,
});

const LegActionCardSchema = BaseCardSchema.extend({
    ActionType: z.literal("Leg"),
    Speed: z.int().nonnegative(),
});

const SpecialActionCardSchema = BaseCardSchema.extend({
    ActionType: z.literal("Special"),
});

export const CardSchema = z.discriminatedUnion("ActionType", [
    ArmActionCardSchema,
    LegActionCardSchema,
    SpecialActionCardSchema
]);