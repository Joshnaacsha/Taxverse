import { IndiaTaxInput } from "../types/taxTypes";
import { ProjectionResult } from "../modules/india/taxProjection";
import { InsightsResult } from "../modules/india/insights";
import { RegimeComparison } from "../modules/india/taxCalculator";
import { ExecutiveSummary } from "../modules/india/executiveSummary";

export interface TaxGraphState {
  userInput: IndiaTaxInput;

  options?: {
    includeAi?: boolean;
    projectionYears?: number;
    projectionGrowthRatePct?: number;
    scenarioCount?: number;
  };

  comparisonResult?: RegimeComparison;
  projection?: ProjectionResult[];
  insights?: InsightsResult;
  executiveSummary?: ExecutiveSummary;

  aiAnalysis?: {
    summary: string;
    stability: "High" | "Medium" | "Low";
    futureWarning?: string;
    actionableAdvice: string[];
  };
}
