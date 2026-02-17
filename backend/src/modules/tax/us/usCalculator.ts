import { UsaTaxInput } from "../../../types/taxTypes";
import { applySlabsWithBreakdown, Slab } from "../progressive";
import { TaxOptionResult, TaxReport } from "../types";

// Simplified US Federal Income Tax (no state tax, no FICA, no credits).
// Tax Year: 2024 (approx). Brackets and standard deductions are hard-coded for demo.

type FilingStatus = UsaTaxInput["filingStatus"];

const STANDARD_DEDUCTION_2024: Record<FilingStatus, number> = {
  SINGLE: 14_600,
  MFJ: 29_200,
  HOH: 21_900,
};

const BRACKETS_2024: Record<FilingStatus, Slab[]> = {
  SINGLE: [
    { upto: 11_600, rate: 0.1 },
    { upto: 47_150, rate: 0.12 },
    { upto: 100_525, rate: 0.22 },
    { upto: 191_950, rate: 0.24 },
    { upto: 243_725, rate: 0.32 },
    { upto: 609_350, rate: 0.35 },
    { upto: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
  MFJ: [
    { upto: 23_200, rate: 0.1 },
    { upto: 94_300, rate: 0.12 },
    { upto: 201_050, rate: 0.22 },
    { upto: 383_900, rate: 0.24 },
    { upto: 487_450, rate: 0.32 },
    { upto: 731_200, rate: 0.35 },
    { upto: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
  HOH: [
    { upto: 16_550, rate: 0.1 },
    { upto: 63_100, rate: 0.12 },
    { upto: 100_500, rate: 0.22 },
    { upto: 191_950, rate: 0.24 },
    { upto: 243_700, rate: 0.32 },
    { upto: 609_350, rate: 0.35 },
    { upto: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
};

function computeOption(params: {
  id: string;
  name: string;
  grossIncome: number;
  deductions: number;
  slabs: Slab[];
  notes?: string[];
}): TaxOptionResult {
  const taxableIncome = Math.max(params.grossIncome - params.deductions, 0);
  const { tax: taxBeforeExtras, breakdown } = applySlabsWithBreakdown(
    taxableIncome,
    params.slabs
  );

  const totalTax = taxBeforeExtras;
  const effectiveRatePct =
    params.grossIncome > 0
      ? Number(((totalTax / params.grossIncome) * 100).toFixed(2))
      : 0;

  return {
    id: params.id,
    name: params.name,
    taxableIncome,
    totalDeductions: params.deductions,
    slabBreakdown: breakdown,
    taxBeforeExtras,
    extrasAmount: 0,
    totalTax,
    effectiveRatePct,
    notes: params.notes,
  };
}

export function buildUsReport(input: UsaTaxInput): TaxReport {
  const grossIncome = input.annualIncome + input.otherIncome;
  const standard = STANDARD_DEDUCTION_2024[input.filingStatus];
  const itemized = Math.max(input.itemizedDeductions ?? 0, 0);
  const slabs = BRACKETS_2024[input.filingStatus];

  const standardOption = computeOption({
    id: "standard",
    name: `Standard deduction (${input.filingStatus})`,
    grossIncome,
    deductions: standard,
    slabs,
    notes: ["Federal income tax only", "No state taxes, FICA, or credits"],
  });

  const itemizedOption = computeOption({
    id: "itemized",
    name: `Itemized deductions (${input.filingStatus})`,
    grossIncome,
    deductions: itemized,
    slabs,
    notes: ["Federal income tax only", "No state taxes, FICA, or credits"],
  });

  const options = itemized > 0 ? [standardOption, itemizedOption] : [standardOption];
  const sorted = [...options].sort((a, b) => a.totalTax - b.totalTax);
  const best = sorted[0]!;
  const second = sorted[1];

  return {
    country: "US",
    taxYear: "US Federal (Tax Year 2024)",
    currency: "USD",
    grossIncome,
    options,
    recommendedOptionId: best.id,
    savings: second ? Math.abs(second.totalTax - best.totalTax) : 0,
    notes: ["Estimates only. Validate with official IRS rules."],
  };
}

