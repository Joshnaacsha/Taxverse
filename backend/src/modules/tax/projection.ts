import { CountryCode } from "../../types/taxTypes";
import { buildTaxReport } from "./engine";
import { getAnnualIncome, setAnnualIncome, AnyCountryInput } from "./inputUtils";
import { ProjectionPoint } from "./types";

export function simulateProjection(params: {
  country: CountryCode;
  input: AnyCountryInput;
  years: number;
  annualGrowthRatePct: number;
}): ProjectionPoint[] {
  const results: ProjectionPoint[] = [];
  let currentAnnualIncome = getAnnualIncome(params.country, params.input);

  for (let year = 1; year <= params.years; year++) {
    currentAnnualIncome = Math.round(
      currentAnnualIncome * (1 + params.annualGrowthRatePct / 100)
    );

    const projectedInput = setAnnualIncome(
      params.country,
      params.input,
      currentAnnualIncome
    ) as any;

    const report = buildTaxReport(params.country as any, projectedInput as any);
    const optionTaxes: Record<string, number> = {};
    for (const opt of report.options) optionTaxes[opt.id] = opt.totalTax;

    results.push({
      year,
      annualIncome: currentAnnualIncome,
      grossIncome: report.grossIncome,
      recommendedOptionId: report.recommendedOptionId,
      optionTaxes,
    });
  }

  return results;
}

