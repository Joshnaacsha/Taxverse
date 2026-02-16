export interface IndiaTaxInput {
  annualSalary: number;
  otherIncome: number;
  deductions80C: number;
  hra: number;
  homeLoanInterest: number;
  nps: number;
}

export type Regime = "Old Regime" | "New Regime";

export interface ProjectionResult {
  year: number;
  annualSalary: number;
  grossIncome: number;
  recommended: Regime;
  oldTax: number;
  newTax: number;
}

export interface ActionLever {
  key: "deductions80C" | "nps" | "homeLoanInterest";
  label: string;
  remaining: number;
  deltaUsed: number;
  estimatedTaxSaved: number;
  estimatedTaxSavedPer10k: number;
}

export interface InsightsResult {
  stability: "High" | "Medium" | "Low";
  stabilityReason: string;
  actionPlan: ActionLever[];
  flipPoints: {
    salaryFlip?: {
      approxAnnualSalary: number;
      recommendedBelow: Regime;
      recommendedAbove: Regime;
    };
    deductionsToFlipToOld?: {
      extraNeeded: number;
      allocation: { deductions80C: number; nps: number; homeLoanInterest: number };
    };
  };
  scenarios: Array<{
    name: string;
    description: string;
    input: IndiaTaxInput;
    comparison: {
      grossIncome: number;
      recommended: Regime;
      savings: number;
      oldRegime: { totalTax: number; taxableIncome: number; totalDeductions: number; effectiveRatePct: number };
      newRegime: { totalTax: number; taxableIncome: number; totalDeductions: number; effectiveRatePct: number };
    };
  }>;
}

export interface AnalyzeResponse {
  userInput: IndiaTaxInput;
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
  comparisonResult?: {
    financialYear: string;
    grossIncome: number;
    recommended: Regime;
    savings: number;
    oldRegime: {
      totalTax: number;
      taxableIncome: number;
      totalDeductions: number;
      effectiveRatePct: number;
      slabBreakdown: Array<{ from: number; to: number; rate: number; taxableAtRate: number; tax: number }>;
      deductionsBreakdown: Array<{ label: string; used: number; cap?: number; allowed: number }>;
    };
    newRegime: {
      totalTax: number;
      taxableIncome: number;
      totalDeductions: number;
      effectiveRatePct: number;
      slabBreakdown: Array<{ from: number; to: number; rate: number; taxableAtRate: number; tax: number }>;
      deductionsBreakdown: Array<{ label: string; used: number; cap?: number; allowed: number }>;
    };
    deductionUsage: {
      section80C: { used: number; limit: number; remaining: number };
      nps: { used: number; limit: number; remaining: number };
      homeLoanInterest: { used: number; limit: number; remaining: number };
    };
  };
  projection?: ProjectionResult[];
  insights?: InsightsResult;
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
