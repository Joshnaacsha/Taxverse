export type CountryCode = "IN" | "US" | "UK" | "SG" | "AE";
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

export type Stability = "High" | "Medium" | "Low";

export interface ActionItem {
  key: string;
  label: string;
  deltaUsed: number;
  estimatedTaxSaved: number;
  estimatedTaxSavedPer10k: number;
  notes?: string[];
}

export interface ScenarioResult {
  name: string;
  description: string;
  report: Pick<TaxReport, "grossIncome" | "options" | "recommendedOptionId" | "savings">;
}

export interface FlipPoints {
  earnedIncomeFlip?: {
    approxAnnualIncome: number;
    recommendedBelow: string;
    recommendedAbove: string;
  };
}

export interface TaxInsights {
  stability: Stability;
  stabilityReason: string;
  actionPlan: ActionItem[];
  flipPoints: FlipPoints;
  scenarios: ScenarioResult[];
}

export interface ProjectionPoint {
  year: number;
  annualIncome: number;
  grossIncome: number;
  recommendedOptionId: string;
  optionTaxes: Record<string, number>;
}

