import { SgTaxInput } from "../../../types/taxTypes";
import { applySlabsWithBreakdown, Slab } from "../progressive";
import { TaxReport } from "../types";

// Simplified Singapore resident income tax (no reliefs/credits).
// YA 2024-ish brackets (approx). This is a demo estimator.

const SLABS: Slab[] = [
  { upto: 20_000, rate: 0 },
  { upto: 30_000, rate: 0.02 },
  { upto: 40_000, rate: 0.035 },
  { upto: 80_000, rate: 0.07 },
  { upto: 120_000, rate: 0.115 },
  { upto: 160_000, rate: 0.15 },
  { upto: 200_000, rate: 0.18 },
  { upto: 240_000, rate: 0.19 },
  { upto: 280_000, rate: 0.195 },
  { upto: 320_000, rate: 0.2 },
  { upto: 500_000, rate: 0.22 },
  { upto: 1_000_000, rate: 0.23 },
  { upto: Number.POSITIVE_INFINITY, rate: 0.24 },
];

export function buildSgReport(input: SgTaxInput): TaxReport {
  const grossIncome = input.annualIncome + input.otherIncome;
  const taxableIncome = Math.max(grossIncome, 0);
  const { tax: taxBeforeExtras, breakdown } = applySlabsWithBreakdown(
    taxableIncome,
    SLABS
  );
  const totalTax = taxBeforeExtras;
  const effectiveRatePct =
    grossIncome > 0 ? Number(((totalTax / grossIncome) * 100).toFixed(2)) : 0;

  return {
    country: "SG",
    taxYear: "Singapore resident income tax (simplified)",
    currency: "SGD",
    grossIncome,
    options: [
      {
        id: "default",
        name: "Resident income tax",
        taxableIncome,
        totalDeductions: 0,
        slabBreakdown: breakdown,
        taxBeforeExtras,
        extrasAmount: 0,
        totalTax,
        effectiveRatePct,
        notes: ["No reliefs/credits included"],
      },
    ],
    recommendedOptionId: "default",
    savings: 0,
    notes: ["Estimates only. Validate with IRAS rules."],
  };
}

