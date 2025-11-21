import z from "zod";
import { DirectionSchema, RangeSchema, StrikeSchema, TargetSchema } from "./common";

const ParryConditionSchema = z.object({
    Condition: z.literal("ParryCondition"),
    Wide: z.boolean().optional()
});

const RangeConditionSchema = z.object({
    Condition: z.literal("RangeCondition"),
    Range: RangeSchema
});

const ThreatConditionSchema = z.object({
    Condition: z.literal("ThreatCondition"),
    Strike: StrikeSchema.optional(),
    Target: TargetSchema.optional()
});

const SterckConditionSchema = z.object({
    Condition: z.literal("SterckCondition"),
    // No need for other fields
});

const MoveConditionSchema = z.object({
    Condition: z.literal("MoveCondition"),
    Direction: DirectionSchema.optional()
});

const ConditionSchema = z.discriminatedUnion("Condition", [
    ParryConditionSchema,
    RangeConditionSchema,
    ThreatConditionSchema,
    SterckConditionSchema,
    MoveConditionSchema
]);

export const ConditionsSchema = z.union([ConditionSchema, z.array(ConditionSchema).min(1)]);