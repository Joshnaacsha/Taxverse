// India Income Tax Calculator
// Financial Year: 2024–25
// Assessment Year: 2025–26

import { IndiaTaxInput } from "../../types/taxTypes";

interface Slab {
  limit: number;
  rate: number;
}

function applySlabs(income: number, slabs: Slab[]): number {
  let tax = 0;
  let previousLimit = 0;

  for (const slab of slabs) {
    if (income > slab.limit) {
      tax += (slab.limit - previousLimit) * slab.rate;
      previousLimit = slab.limit;
    } else {
      tax += (income - previousLimit) * slab.rate;
      break;
    }
  }

  return tax;
}

function applyCess(tax: number): number {
  return tax + tax * 0.04; // 4% Health & Education Cess
}

/* =========================
   OLD REGIME
========================= */

export function calculateOldRegime(input: IndiaTaxInput) {
  const grossIncome = input.annualSalary + input.otherIncome;

  // Deduction caps
  const deductions80C = Math.min(input.deductions80C, 150000);
  const nps = Math.min(input.nps, 50000);
  const homeLoan = Math.min(input.homeLoanInterest, 200000);

  const totalDeductions =
    deductions80C +
    nps +
    homeLoan +
    input.hra +
    50000; // Standard deduction

  const taxableIncome = Math.max(grossIncome - totalDeductions, 0);

  // 87A Rebate (Old Regime)
  if (taxableIncome <= 500000) {
    return {
      taxableIncome,
      totalDeductions,
      taxBeforeCess: 0,
      cessAmount: 0,
      totalTax: 0,
    };
  }

  const slabs: Slab[] = [
    { limit: 250000, rate: 0 },
    { limit: 500000, rate: 0.05 },
    { limit: 1000000, rate: 0.2 },
    { limit: Infinity, rate: 0.3 },
  ];

  const taxBeforeCess = applySlabs(taxableIncome, slabs);
  const totalTax = applyCess(taxBeforeCess);

  return {
    taxableIncome,
    totalDeductions,
    taxBeforeCess,
    cessAmount: totalTax - taxBeforeCess,
    totalTax,
  };
}

/* =========================
   NEW REGIME
========================= */

export function calculateNewRegime(input: IndiaTaxInput) {
  const grossIncome = input.annualSalary + input.otherIncome;

  const standardDeduction = 50000;
  const taxableIncome = Math.max(grossIncome - standardDeduction, 0);

  // 87A Rebate (New Regime)
  if (taxableIncome <= 700000) {
    return {
      taxableIncome,
      totalDeductions: standardDeduction,
      taxBeforeCess: 0,
      cessAmount: 0,
      totalTax: 0,
    };
  }

  const slabs: Slab[] = [
    { limit: 300000, rate: 0 },
    { limit: 600000, rate: 0.05 },
    { limit: 900000, rate: 0.1 },
    { limit: 1200000, rate: 0.15 },
    { limit: 1500000, rate: 0.2 },
    { limit: Infinity, rate: 0.3 },
  ];

  const taxBeforeCess = applySlabs(taxableIncome, slabs);
  const totalTax = applyCess(taxBeforeCess);

  return {
    taxableIncome,
    totalDeductions: standardDeduction,
    taxBeforeCess,
    cessAmount: totalTax - taxBeforeCess,
    totalTax,
  };
}

/* =========================
   COMPARISON ENGINE
========================= */

export function compareRegimes(input: IndiaTaxInput) {
  const grossIncome = input.annualSalary + input.otherIncome;

  const oldRegime = calculateOldRegime(input);
  const newRegime = calculateNewRegime(input);

  const recommended =
    oldRegime.totalTax < newRegime.totalTax
      ? "Old Regime"
      : "New Regime";

  // Deduction usage summary (for future optimization agent)
  const deductionUsage = {
    section80C: {
      used: input.deductions80C,
      limit: 150000,
      remaining: Math.max(150000 - input.deductions80C, 0),
    },
    nps: {
      used: input.nps,
      limit: 50000,
      remaining: Math.max(50000 - input.nps, 0),
    },
    homeLoanInterest: {
      used: input.homeLoanInterest,
      limit: 200000,
      remaining: Math.max(200000 - input.homeLoanInterest, 0),
    },
  };

  return {
    financialYear: "FY 2024-25",
    grossIncome,

    oldRegime: {
      ...oldRegime,
      effectiveRate:
        grossIncome > 0
          ? Number(((oldRegime.totalTax / grossIncome) * 100).toFixed(2))
          : 0,
    },

    newRegime: {
      ...newRegime,
      effectiveRate:
        grossIncome > 0
          ? Number(((newRegime.totalTax / grossIncome) * 100).toFixed(2))
          : 0,
    },

    savings: Math.abs(oldRegime.totalTax - newRegime.totalTax),
    recommended,
    deductionUsage,
  };
}
