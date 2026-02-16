import { IndiaTaxInput } from "../../types/taxTypes";
import { compareRegimes } from "./taxCalculator";

export interface ProjectionResult {
  year: number;
  grossIncome: number;
  recommended: "Old Regime" | "New Regime";
  oldTax: number;
  newTax: number;
}

export function simulateIncomeProjection(
  input: IndiaTaxInput,
  growthRate: number = 10,
  years: number = 3
): ProjectionResult[] {
  const results: ProjectionResult[] = [];

  let currentSalary = input.annualSalary;

  for (let year = 1; year <= years; year++) {
    currentSalary = Math.round(currentSalary * (1 + growthRate / 100));

    const projectedInput: IndiaTaxInput = {
      ...input,
      annualSalary: currentSalary,
    };

    const comparison = compareRegimes(projectedInput);

    results.push({
      year,
      grossIncome: comparison.grossIncome,
      recommended: comparison.recommended as "Old Regime" | "New Regime",
      oldTax: comparison.oldRegime.totalTax,
      newTax: comparison.newRegime.totalTax,
    });
  }

  return results;
}
