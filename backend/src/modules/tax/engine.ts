import { CountryCode } from "../../types/taxTypes";
import { IndiaTaxInput, UsaTaxInput, UkTaxInput, SgTaxInput, AeTaxInput } from "../../types/taxTypes";
import { TaxReport } from "./types";
import { compareRegimes } from "../india/taxCalculator";
import { buildUsReport } from "./us/usCalculator";
import { buildUkReport } from "./uk/ukCalculator";
import { buildSgReport } from "./sg/sgCalculator";
import { buildAeReport } from "./ae/aeCalculator";

export type CountryInputMap = {
  IN: IndiaTaxInput;
  US: UsaTaxInput;
  UK: UkTaxInput;
  SG: SgTaxInput;
  AE: AeTaxInput;
};

export function buildTaxReport<C extends CountryCode>(
  country: C,
  input: CountryInputMap[C]
): TaxReport {
  switch (country) {
    case "IN": {
      const comparison = compareRegimes(input as IndiaTaxInput);
      const oldR = comparison.oldRegime;
      const newR = comparison.newRegime;

      const options = [
        {
          id: "old",
          name: "Old Regime",
          taxableIncome: oldR.taxableIncome,
          totalDeductions: oldR.totalDeductions,
          deductionsBreakdown: oldR.deductionsBreakdown,
          slabBreakdown: oldR.slabBreakdown,
          taxBeforeExtras: oldR.taxBeforeCess,
          extrasAmount: oldR.cessAmount,
          totalTax: oldR.totalTax,
          effectiveRatePct: oldR.effectiveRatePct,
          notes: ["Includes 4% cess", "HRA is simplified for demo"],
        },
        {
          id: "new",
          name: "New Regime",
          taxableIncome: newR.taxableIncome,
          totalDeductions: newR.totalDeductions,
          deductionsBreakdown: newR.deductionsBreakdown,
          slabBreakdown: newR.slabBreakdown,
          taxBeforeExtras: newR.taxBeforeCess,
          extrasAmount: newR.cessAmount,
          totalTax: newR.totalTax,
          effectiveRatePct: newR.effectiveRatePct,
          notes: ["Includes 4% cess"],
        },
      ];

      const recommendedOptionId = comparison.recommended === "Old Regime" ? "old" : "new";
      const best = options.find((o) => o.id === recommendedOptionId)!;
      const second = options.find((o) => o.id !== recommendedOptionId)!;

      return {
        country: "IN",
        taxYear: comparison.financialYear,
        currency: "INR",
        grossIncome: comparison.grossIncome,
        options,
        recommendedOptionId,
        savings: Math.abs(second.totalTax - best.totalTax),
        notes: ["Estimates only. Verify with official rules."],
      };
    }
    case "US":
      return buildUsReport(input as UsaTaxInput);
    case "UK":
      return buildUkReport(input as UkTaxInput);
    case "SG":
      return buildSgReport(input as SgTaxInput);
    case "AE":
      return buildAeReport(input as AeTaxInput);
    default:
      return buildTaxReport("IN", input as any);
  }
}

