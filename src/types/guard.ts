import z from "zod";
import { ArmActionTypeSchema, CardIdSchema, CategoriesSchema, StatSchema, StrikeSchema, TargetSchema } from "./common";
import { ConditionsSchema } from "./condition";

// "If your opponent has strong pressure, Oberhaus gain +1 Speed" -> PressureCondition
// "You have +2 Speed to parrying thrusts" -> ArmActionType + ThreatCondition
const StatModifierSchema = z.object({
    // Optional condition to be met
    Condition: ConditionsSchema.optional(),
    Categories: CategoriesSchema.optional(), // Guards mainly buff different categories, "Oberhau", etc.
    // Specify if it is a normal action, parry, defend, etc.
    ArmActionType: z.union([ArmActionTypeSchema, z.array(ArmActionTypeSchema).nonempty()]).optional(),
    Stat: StatSchema,
    Value: z.int()
});

const StatModifiersSchema = z.union([StatModifierSchema, z.array(StatModifierSchema)]);
export const GuardSchema = z.object({
    Card: z.string(), // Card to pull Speed/Structure stats from
    ConsumeTo: z.array(CardIdSchema).optional(), // List of card IDs
    CoverCondition: z.object({
        Strike: z.union([StrikeSchema, z.array(StrikeSchema).nonempty()]).optional(),
        Target: TargetSchema.optional()
    }).optional(),
    Modifiers: StatModifiersSchema,
})