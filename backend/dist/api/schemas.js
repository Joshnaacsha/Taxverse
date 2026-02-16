"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QaResponseSchema = exports.QaRequestSchema = exports.QaMessageSchema = exports.AiAnalysisSchema = exports.AnalyzeRequestSchema = exports.AnalyzeOptionsSchema = exports.AeTaxInputSchema = exports.SgTaxInputSchema = exports.UkTaxInputSchema = exports.UsaTaxInputSchema = exports.IndiaTaxInputSchema = void 0;
const zod_1 = require("zod");
exports.IndiaTaxInputSchema = zod_1.z.object({
    annualSalary: zod_1.z.number().nonnegative(),
    otherIncome: zod_1.z.number().nonnegative(),
    deductions80C: zod_1.z.number().nonnegative(),
    hra: zod_1.z.number().nonnegative(),
    homeLoanInterest: zod_1.z.number().nonnegative(),
    nps: zod_1.z.number().nonnegative(),
});
exports.UsaTaxInputSchema = zod_1.z
    .object({
    annualIncome: zod_1.z.number().nonnegative(),
    otherIncome: zod_1.z.number().nonnegative(),
    filingStatus: zod_1.z.enum(["SINGLE", "MFJ", "HOH"]),
    itemizedDeductions: zod_1.z.number().nonnegative().optional(),
})
    .strict();
exports.UkTaxInputSchema = zod_1.z
    .object({
    annualIncome: zod_1.z.number().nonnegative(),
    otherIncome: zod_1.z.number().nonnegative(),
})
    .strict();
exports.SgTaxInputSchema = zod_1.z
    .object({
    annualIncome: zod_1.z.number().nonnegative(),
    otherIncome: zod_1.z.number().nonnegative(),
})
    .strict();
exports.AeTaxInputSchema = zod_1.z
    .object({
    annualIncome: zod_1.z.number().nonnegative(),
    otherIncome: zod_1.z.number().nonnegative(),
})
    .strict();
exports.AnalyzeOptionsSchema = zod_1.z
    .object({
    financialYear: zod_1.z.custom().optional(),
    includeAi: zod_1.z.boolean().optional(),
    projectionYears: zod_1.z.number().int().min(1).max(30).optional(),
    projectionGrowthRatePct: zod_1.z.number().min(-50).max(100).optional(),
    scenarioCount: zod_1.z.number().int().min(1).max(20).optional(),
})
    .strict();
exports.AnalyzeRequestSchema = zod_1.z.discriminatedUnion("country", [
    zod_1.z
        .object({
        country: zod_1.z.literal("IN"),
        input: exports.IndiaTaxInputSchema,
        options: exports.AnalyzeOptionsSchema.optional(),
    })
        .strict(),
    zod_1.z
        .object({
        country: zod_1.z.literal("US"),
        input: exports.UsaTaxInputSchema,
        options: exports.AnalyzeOptionsSchema.optional(),
    })
        .strict(),
    zod_1.z
        .object({
        country: zod_1.z.literal("UK"),
        input: exports.UkTaxInputSchema,
        options: exports.AnalyzeOptionsSchema.optional(),
    })
        .strict(),
    zod_1.z
        .object({
        country: zod_1.z.literal("SG"),
        input: exports.SgTaxInputSchema,
        options: exports.AnalyzeOptionsSchema.optional(),
    })
        .strict(),
    zod_1.z
        .object({
        country: zod_1.z.literal("AE"),
        input: exports.AeTaxInputSchema,
        options: exports.AnalyzeOptionsSchema.optional(),
    })
        .strict(),
]);
exports.AiAnalysisSchema = zod_1.z
    .object({
    summary: zod_1.z.string(),
    stability: zod_1.z.enum(["High", "Medium", "Low"]),
    futureWarning: zod_1.z.string().optional(),
    actionableAdvice: zod_1.z.array(zod_1.z.string()),
})
    .strict();
exports.QaMessageSchema = zod_1.z
    .object({
    role: zod_1.z.enum(["user", "assistant"]),
    content: zod_1.z.string().min(1).max(4000),
})
    .strict();
exports.QaRequestSchema = zod_1.z
    .object({
    context: zod_1.z.unknown(),
    question: zod_1.z.string().min(1).max(1000),
    history: zod_1.z.array(exports.QaMessageSchema).max(20).optional(),
})
    .strict();
exports.QaResponseSchema = zod_1.z
    .object({
    answer: zod_1.z.string(),
    followUps: zod_1.z.array(zod_1.z.string()).optional(),
})
    .strict();
