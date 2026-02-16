import { IndiaTaxInput } from "../../types/taxTypes";
import { compareRegimes } from "./taxCalculator";

export interface ProjectionResult {
  year: number;
  annualSalary: number;
  grossIncome: number;
  recommended: "Old Regime" | "New Regime";
  oldTax: number;
  newTax: number;
}

export function simulateIncomeProjection(
  input: IndiaTaxInput,
  years: number = 3,
  annualGrowthRatePct: number = 10
): ProjectionResult[] {
  const results: ProjectionResult[] = [];

  let currentSalary = input.annualSalary;

  for (let year = 1; year <= years; year++) {
    currentSalary = Math.round(currentSalary * (1 + annualGrowthRatePct / 100));

    const projectedInput: IndiaTaxInput = {
      ...input,
      annualSalary: currentSalary,
    };

    const comparison = compareRegimes(projectedInput);

    results.push({
      year,
      annualSalary: currentSalary,
      grossIncome: comparison.grossIncome,
      recommended: comparison.recommended as "Old Regime" | "New Regime",
      oldTax: comparison.oldRegime.totalTax,
      newTax: comparison.newRegime.totalTax,
    });
  }

  return results;
}
