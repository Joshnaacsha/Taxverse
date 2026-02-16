import { AeTaxInput } from "../../../types/taxTypes";
import { TaxReport } from "../types";

// UAE currently has no federal personal income tax (simplified for demo).

export function buildAeReport(input: AeTaxInput): TaxReport {
  const grossIncome = input.annualIncome + input.otherIncome;
  return {
    country: "AE",
    taxYear: "UAE Personal Income Tax (simplified)",
    currency: "AED",
    grossIncome,
    options: [
      {
        id: "default",
        name: "No personal income tax",
        taxableIncome: grossIncome,
        totalDeductions: 0,
        slabBreakdown: [],
        taxBeforeExtras: 0,
        extrasAmount: 0,
        totalTax: 0,
        effectiveRatePct: 0,
        notes: ["Assumes UAE federal personal income tax is not applicable"],
      },
    ],
    recommendedOptionId: "default",
    savings: 0,
    notes: ["Estimates only. Validate with local rules."],
  };
}

