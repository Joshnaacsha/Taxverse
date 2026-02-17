export interface IndiaTaxInput {
  annualSalary: number;
  otherIncome: number;
  deductions80C: number;
  hra: number;
  homeLoanInterest: number;
  nps: number;
}

export type CountryCode = "IN" | "US" | "UK" | "SG" | "AE";

export interface UsaTaxInput {
  annualIncome: number;
  otherIncome: number;
  filingStatus: "SINGLE" | "MFJ" | "HOH";
  itemizedDeductions?: number;
}

export interface UkTaxInput {
  annualIncome: number;
  otherIncome: number;
}

export interface SgTaxInput {
  annualIncome: number;
  otherIncome: number;
}

export interface AeTaxInput {
  annualIncome: number;
  otherIncome: number;
}

export type AnyTaxInput = IndiaTaxInput | UsaTaxInput | UkTaxInput | SgTaxInput | AeTaxInput;

export type CurrencyCode = "INR" | "USD" | "GBP" | "SGD" | "AED";

export interface TaxSlabLine {
  from: number;
  to: number;
  rate: number;
  taxableAtRate: number;
  tax: number;
}

export interface TaxDeductionLine {
  label: string;
  used: number;
  cap?: number;
  allowed: number;
}

export interface TaxOptionResult {
  id: string;
  name: string;
  taxableIncome: number;
  totalDeductions: number;
  deductionsBreakdown?: TaxDeductionLine[];
  slabBreakdown: TaxSlabLine[];
  taxBeforeExtras: number;
  extrasAmount: number;
  totalTax: number;
  effectiveRatePct: number;
  notes?: string[];
}

export interface TaxReport {
  country: CountryCode;
  taxYear: string;
  currency: CurrencyCode;
  grossIncome: number;
  options: TaxOptionResult[];
  recommendedOptionId: string;
  savings: number;
  notes: string[];
}

export interface ProjectionResult {
  year: number;
  annualSalary: number;
  grossIncome: number;
  recommended: string;
}

export interface ActionLever {
  key: "deductions80C" | "nps" | "homeLoanInterest";
  label: string;
  remaining: number;
  deltaUsed: number;
  estimatedTaxSaved: number;
  estimatedTaxSavedPer10k: number;
}

export interface TaxInsights {
  stability: "High" | "Medium" | "Low";
  stabilityReason: string;
  actionPlan: Array<{
    key: string;
    label: string;
    deltaUsed: number;
    estimatedTaxSaved: number;
    estimatedTaxSavedPer10k: number;
    notes?: string[];
  }>;
  flipPoints: {
    earnedIncomeFlip?: {
      approxAnnualIncome: number;
      recommendedBelow: string;
      recommendedAbove: string;
    };
  };
  scenarios: Array<{
    name: string;
    description: string;
    report: Pick<TaxReport, "grossIncome" | "options" | "recommendedOptionId" | "savings">;
  }>;
}

export interface AnalyzeResponse {
  country: CountryCode;
  userInput: AnyTaxInput;
  options?: {
    includeAi?: boolean;
    projectionYears?: number;
    projectionGrowthRatePct?: number;
    scenarioCount?: number;
  };
  executiveSummary?: {
    headline: string;
    bullets: string[];
  };
  report?: TaxReport;
  projection?: Array<{
    year: number;
    annualIncome: number;
    grossIncome: number;
    recommendedOptionId: string;
    optionTaxes: Record<string, number>;
  }>;
  insights?: TaxInsights;
  aiAnalysis?: {
    summary: string;
    stability: "High" | "Medium" | "Low";
    futureWarning?: string;
    actionableAdvice: string[];
  };
}

export interface QaMessage {
  role: "user" | "assistant";
  content: string;
}

export interface QaResponse {
  answer: string;
  followUps?: string[];
}

export type SalaryInputMode = "manual" | "payslip_pdf";

export interface SalaryComponentsMonthly {
  basic: number;
  hra: number;
  specialAllowance: number;
  otherAllowance: number;
  bonusMonthly: number;
}

export interface SalaryDeductionsMonthly {
  employeePf: number;
  professionalTax: number;
  otherDeductions: number;
}

export interface IndiaSalaryInput {
  mode: SalaryInputMode;
  componentsMonthly: SalaryComponentsMonthly;
  deductionsMonthly: SalaryDeductionsMonthly;
  otherIncomeAnnual: number;
  investments80CAnnual: number;
  npsAnnual: number;
  homeLoanInterestAnnual: number;
  tdsPaidYtd: number;
  monthsRemaining: number;
  currency: "INR";
}

export interface IndiaSalaryBreakdown {
  grossMonthly: number;
  deductionsMonthly: number;
  inHandMonthlyBeforeTax: number;
  annualGross: number;
  annualEmployeePf: number;
  annualProfessionalTax: number;
  annualOtherDeductions: number;
}

export interface IndiaTdsPlan {
  annualTaxPayable: number;
  taxPaidYtd: number;
  taxRemaining: number;
  monthsRemaining: number;
  suggestedMonthlyTdsFromNow: number;
}

export interface SalaryResult {
  input: IndiaSalaryInput;
  breakdown: IndiaSalaryBreakdown;
  derivedTaxInput: IndiaTaxInput;
  tdsPlan?: IndiaTdsPlan;
}

export interface PayslipParseResponse {
  confidence: "low" | "medium" | "high";
  componentsMonthly?: Partial<SalaryComponentsMonthly>;
  deductionsMonthly?: Partial<SalaryDeductionsMonthly>;
  tdsPaidYtd?: number;
  notes?: string[];
  extractedTextPreview?: string;
}

export interface SalaryAnalyzeResponse {
  salary: SalaryResult;
  analysis: AnalyzeResponse;
}
