import { z } from "zod";
import type { FinancialYear } from "../types/taxTypes";

export const IndiaTaxInputSchema = z.object({
  annualSalary: z.number().nonnegative(),
  otherIncome: z.number().nonnegative(),
  deductions80C: z.number().nonnegative(),
  hra: z.number().nonnegative(),
  homeLoanInterest: z.number().nonnegative(),
  nps: z.number().nonnegative(),
});

export const PayslipParseRequestSchema = z
  .object({
    filename: z.string().min(1).max(200),
    mimeType: z.literal("application/pdf"),
    dataBase64: z.string().min(50),
  })
  .strict();

export const PayslipParseResponseSchema = z
  .object({
    confidence: z.enum(["low", "medium", "high"]),
    componentsMonthly: z
      .object({
        basic: z.number().nonnegative().optional(),
        hra: z.number().nonnegative().optional(),
        specialAllowance: z.number().nonnegative().optional(),
        otherAllowance: z.number().nonnegative().optional(),
        bonusMonthly: z.number().nonnegative().optional(),
      })
      .optional(),
    deductionsMonthly: z
      .object({
        employeePf: z.number().nonnegative().optional(),
        professionalTax: z.number().nonnegative().optional(),
        otherDeductions: z.number().nonnegative().optional(),
      })
      .optional(),
    tdsPaidYtd: z.number().nonnegative().optional(),
    notes: z.array(z.string()).optional(),
    extractedTextPreview: z.string().optional(),
  })
  .strict();

export const IndiaSalaryAnalyzeRequestSchema = z
  .object({
    mode: z.enum(["manual", "payslip_pdf"]),
    componentsMonthly: z
      .object({
        basic: z.number().nonnegative(),
        hra: z.number().nonnegative(),
        specialAllowance: z.number().nonnegative(),
        otherAllowance: z.number().nonnegative(),
        bonusMonthly: z.number().nonnegative(),
      })
      .strict(),
    deductionsMonthly: z
      .object({
        employeePf: z.number().nonnegative(),
        professionalTax: z.number().nonnegative(),
        otherDeductions: z.number().nonnegative(),
      })
      .strict(),
    otherIncomeAnnual: z.number().nonnegative().default(0),
    investments80CAnnual: z.number().nonnegative().default(0),
    npsAnnual: z.number().nonnegative().default(0),
    homeLoanInterestAnnual: z.number().nonnegative().default(0),
    tdsPaidYtd: z.number().nonnegative().default(0),
    monthsRemaining: z.number().int().min(0).max(12).default(0),
  })
  .strict();

export const UsaTaxInputSchema = z
  .object({
    annualIncome: z.number().nonnegative(),
    otherIncome: z.number().nonnegative(),
    filingStatus: z.enum(["SINGLE", "MFJ", "HOH"]),
    itemizedDeductions: z.number().nonnegative().optional(),
  })
  .strict();

export const UkTaxInputSchema = z
  .object({
    annualIncome: z.number().nonnegative(),
    otherIncome: z.number().nonnegative(),
  })
  .strict();

export const SgTaxInputSchema = z
  .object({
    annualIncome: z.number().nonnegative(),
    otherIncome: z.number().nonnegative(),
  })
  .strict();

export const AeTaxInputSchema = z
  .object({
    annualIncome: z.number().nonnegative(),
    otherIncome: z.number().nonnegative(),
  })
  .strict();

export const AnalyzeOptionsSchema = z
  .object({
    financialYear: z.custom<FinancialYear>().optional(),
    includeAi: z.boolean().optional(),
    projectionYears: z.number().int().min(1).max(30).optional(),
    projectionGrowthRatePct: z.number().min(-50).max(100).optional(),
    scenarioCount: z.number().int().min(1).max(20).optional(),
  })
  .strict();

export const AnalyzeRequestSchema = z.discriminatedUnion("country", [
  z
    .object({
      country: z.literal("IN"),
      input: IndiaTaxInputSchema,
      options: AnalyzeOptionsSchema.optional(),
    })
    .strict(),
  z
    .object({
      country: z.literal("US"),
      input: UsaTaxInputSchema,
      options: AnalyzeOptionsSchema.optional(),
    })
    .strict(),
  z
    .object({
      country: z.literal("UK"),
      input: UkTaxInputSchema,
      options: AnalyzeOptionsSchema.optional(),
    })
    .strict(),
  z
    .object({
      country: z.literal("SG"),
      input: SgTaxInputSchema,
      options: AnalyzeOptionsSchema.optional(),
    })
    .strict(),
  z
    .object({
      country: z.literal("AE"),
      input: AeTaxInputSchema,
      options: AnalyzeOptionsSchema.optional(),
    })
    .strict(),
]);

export const AiAnalysisSchema = z
  .object({
    summary: z.string(),
    stability: z.enum(["High", "Medium", "Low"]),
    futureWarning: z.string().optional(),
    actionableAdvice: z.array(z.string()),
  })
  .strict();

export const QaMessageSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(4000),
  })
  .strict();

export const QaRequestSchema = z
  .object({
    context: z.unknown(),
    question: z.string().min(1).max(1000),
    history: z.array(QaMessageSchema).max(20).optional(),
  })
  .strict();

export const QaResponseSchema = z
  .object({
    answer: z.string(),
    followUps: z.array(z.string()).optional(),
  })
  .strict();

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type IndiaSalaryAnalyzeRequest = z.infer<typeof IndiaSalaryAnalyzeRequestSchema>;
export type PayslipParseRequest = z.infer<typeof PayslipParseRequestSchema>;
