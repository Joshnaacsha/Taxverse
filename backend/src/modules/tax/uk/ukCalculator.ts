import { UkTaxInput } from "../../../types/taxTypes";
import { applySlabsWithBreakdown, Slab } from "../progressive";
import { TaxReport } from "../types";

// Simplified UK Income Tax (England/Wales/NI style) - no NI, no Scottish rates.
// Tax Year: 2024/25 (approx). Personal allowance taper included.

const PERSONAL_ALLOWANCE = 12_570;
const BASIC_RATE_LIMIT = 50_270;
const HIGHER_RATE_LIMIT = 125_140;

const SLABS: Slab[] = [
  { upto: BASIC_RATE_LIMIT, rate: 0.2 },
  { upto: HIGHER_RATE_LIMIT, rate: 0.4 },
  { upto: Number.POSITIVE_INFINITY, rate: 0.45 },
];

function personalAllowanceForIncome(grossIncome: number): number {
  if (grossIncome <= 100_000) return PERSONAL_ALLOWANCE;
  const reduction = Math.floor((grossIncome - 100_000) / 2);
  return Math.max(PERSONAL_ALLOWANCE - reduction, 0);
}

export function buildUkReport(input: UkTaxInput): TaxReport {
  const grossIncome = input.annualIncome + input.otherIncome;
  const allowance = personalAllowanceForIncome(grossIncome);
  const taxableIncome = Math.max(grossIncome - allowance, 0);

  const { tax: taxBeforeExtras, breakdown } = applySlabsWithBreakdown(
    taxableIncome,
    SLABS
  );

  const totalTax = taxBeforeExtras;
  const effectiveRatePct =
    grossIncome > 0 ? Number(((totalTax / grossIncome) * 100).toFixed(2)) : 0;

  return {
    country: "UK",
    taxYear: "UK Income Tax (2024/25)",
    currency: "GBP",
    grossIncome,
    options: [
      {
        id: "default",
        name: "Income tax",
        taxableIncome,
        totalDeductions: allowance,
        slabBreakdown: breakdown,
        taxBeforeExtras,
        extrasAmount: 0,
        totalTax,
        effectiveRatePct,
        notes: ["No National Insurance", "Not Scotland-specific"],
      },
    ],
    recommendedOptionId: "default",
    savings: 0,
    notes: ["Estimates only. Validate with official HMRC rules."],
  };
}

