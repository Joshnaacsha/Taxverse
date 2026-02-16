import { CountryCode } from "../types/taxTypes";
import { AnyCountryInput } from "../modules/tax/inputUtils";
import { ProjectionPoint, TaxInsights, TaxReport } from "../modules/tax/types";
import { ExecutiveSummary } from "../modules/india/executiveSummary";

export interface TaxGraphState {
  country: CountryCode;
  userInput: AnyCountryInput;

  options?: {
    includeAi?: boolean;
    projectionYears?: number;
    projectionGrowthRatePct?: number;
    scenarioCount?: number;
  };

  report?: TaxReport;
  projection?: ProjectionPoint[];
  insights?: TaxInsights;
  executiveSummary?: ExecutiveSummary;

  aiAnalysis?: {
    summary: string;
    stability: "High" | "Medium" | "Low";
    futureWarning?: string;
    actionableAdvice: string[];
  };
}
