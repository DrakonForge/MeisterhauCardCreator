import z from "zod";
import { DirectionSchema, GuardArchetypeSchema, ValueRangeSchema, StrikeSchema, TargetSchema, PlayerSchema } from "./common";

const ParryConditionSchema = z.object({
    Condition: z.literal("ParryCondition"),
    Wide: z.boolean().optional()
});

const RangeConditionSchema = z.object({
    Condition: z.literal("RangeCondition"),
    Range: ValueRangeSchema
});

const ThreatConditionSchema = z.object({
    Condition: z.literal("ThreatCondition"),
    Strike: z.union([StrikeSchema, z.array(StrikeSchema).nonempty()]).optional(),
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

const GuardConditionSchema = z.object({
    Condition: z.literal("GuardCondition"),
    Target: PlayerSchema,
    GuardArchetype: GuardArchetypeSchema.optional(),
    HasGuard: z.boolean().optional()
});

const PressureCondition = z.object({
    Condition: z.literal("PressureCondition"),
    Target: PlayerSchema,
    Range: ValueRangeSchema
})

const ConditionSchema = z.discriminatedUnion("Condition", [
    ParryConditionSchema,
    RangeConditionSchema,
    ThreatConditionSchema,
    SterckConditionSchema,
    MoveConditionSchema,
    GuardConditionSchema,
    PressureCondition
]);

export const ConditionsSchema = z.union([ConditionSchema, z.array(ConditionSchema).nonempty()]);