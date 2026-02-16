import { IndiaTaxInput } from "../types/taxTypes";

export interface TaxGraphState {
  userInput: IndiaTaxInput;

  comparisonResult?: any;

  aiAnalysis?: {
    summary: string;
    stability: "High" | "Medium" | "Low";
    futureWarning?: string;
    actionableAdvice: string[];
  };
}
