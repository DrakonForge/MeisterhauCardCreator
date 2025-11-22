import z, { ZodType } from "zod";
import { ActionTypesSchema, GuardArchetypeSchema, GuardIdSchema, KeywordsSchema, PlayerSchema, StatSchema, StrikeSchema, TargetSchema } from "./common";
import { ConditionsSchema } from "./condition";

const DefendSchema = z.object({
    Action: z.literal("Defend"),
});

const GainKeywordsSchema = z.object({
    Action: z.literal("GainKeywords"),
    Keywords: KeywordsSchema
});

const BreakGuardSchema = z.object({
    Action: z.literal("BreakGuard"),
    GuardArchetype: GuardArchetypeSchema.optional(),
    Keywords: KeywordsSchema.optional(),
});

const ChangeGuardSchema = z.object({
    Action: z.literal("ChangeGuard"),
    Guard: GuardIdSchema
});

const CheckConditionSchema = z.object({
    Action: z.literal("CheckCondition"),
    Conditions: ConditionsSchema,
    // Using a getter to express a recursive type
    get Behavior(): ZodType {
        return BehaviorSchema
    },
    // Whether the behavior this CheckCondition is in should stop if this value is true
    EndsBranch: z.boolean().default(false),
});

const AttackSchema = z.object({
    Action: z.literal("Attack"),
    Strike: StrikeSchema,
    Target: TargetSchema,
});

const ChangeNextStatSchema = z.object({
    Action: z.literal("ChangeNextStat"),
    Target: PlayerSchema,
    Stat: StatSchema,
    ActionTypes: ActionTypesSchema.optional(),
    Value: z.int(),
});

const ChangeStatSchema = z.object({
    Action: z.literal("ChangeStat"),
    Target: PlayerSchema,
    Stat: StatSchema,
    ActionTypes: ActionTypesSchema.optional(),
    Value: z.int(),
});

const PlayNormalActionSchema = z.object({
    Action: z.literal("PlayNormalAction")
});

const PlayDefendActionSchema = z.object({
    Action: z.literal("PlayDefendAction")
});

const BehaviorActionSchema = z.discriminatedUnion("Action", [
    DefendSchema,
    GainKeywordsSchema,
    BreakGuardSchema,
    ChangeGuardSchema,
    CheckConditionSchema,
    AttackSchema,
    ChangeStatSchema,
    ChangeNextStatSchema,
    PlayNormalActionSchema,
    PlayDefendActionSchema,
]);

export const BehaviorSchema = z.union([BehaviorActionSchema, z.array(BehaviorActionSchema)]);