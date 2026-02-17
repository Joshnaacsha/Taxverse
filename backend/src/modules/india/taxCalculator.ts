import { IndiaTaxInput, FinancialYear } from "../../types/taxTypes";
import { getPolicy, Regime, Slab, TaxPolicy } from "./policy";

export interface SlabLine {
  from: number;
  to: number;
  rate: number;
  taxableAtRate: number;
  tax: number;
}

export interface DeductionLine {
  label: string;
  used: number;
  cap?: number;
  allowed: number;
}

export interface TaxComputation {
  regime: Regime;
  financialYear: FinancialYear;
  grossIncome: number;
  taxableIncome: number;
  totalDeductions: number;
  deductionsBreakdown: DeductionLine[];
  rebate87A: { threshold: number; applied: boolean };
  slabBreakdown: SlabLine[];
  taxBeforeCess: number;
  cessAmount: number;
  totalTax: number;
  effectiveRatePct: number;
}

export interface RegimeComparison {
  financialYear: FinancialYear;
  grossIncome: number;
  oldRegime: TaxComputation;
  newRegime: TaxComputation;
  recommended: Regime;
  savings: number;
  margin: number; // abs(old - new)
  deductionUsage: {
    section80C: { used: number; limit: number; remaining: number };
    nps: { used: number; limit: number; remaining: number };
    homeLoanInterest: { used: number; limit: number; remaining: number };
  };
}

function applySlabsWithBreakdown(income: number, slabs: Slab[]): { tax: number; breakdown: SlabLine[] } {
  let tax = 0;
  let previous = 0;
  const breakdown: SlabLine[] = [];

  for (const slab of slabs) {
    const to = slab.upto;
    const upper = Number.isFinite(to) ? Math.min(income, to) : income;
    const taxableAtRate = Math.max(upper - previous, 0);
    const slabTax = taxableAtRate * slab.rate;

    breakdown.push({
      from: previous,
      to: Number.isFinite(to) ? to : income,
      rate: slab.rate,
      taxableAtRate,
      tax: slabTax,
    });

    tax += slabTax;
    previous = to;
    if (income <= to) break;
  }

  return { tax, breakdown };
}

function applyCess(taxBeforeCess: number, policy: TaxPolicy): { totalTax: number; cessAmount: number } {
  const cessAmount = taxBeforeCess * policy.cessRate;
  return { totalTax: taxBeforeCess + cessAmount, cessAmount };
}

export function calculateOldRegime(input: IndiaTaxInput, financialYear: FinancialYear = "FY 2024-25"): TaxComputation {
  const policy = getPolicy(financialYear);
  const grossIncome = input.annualSalary + input.otherIncome;

  const d80cAllowed = Math.min(input.deductions80C, policy.caps.deductions80C);
  const npsAllowed = Math.min(input.nps, policy.caps.nps);
  const homeLoanAllowed = Math.min(input.homeLoanInterest, policy.caps.homeLoanInterest);
  const standardDeduction = policy.standardDeduction;

  const deductionsBreakdown: DeductionLine[] = [
    { label: "Section 80C", used: input.deductions80C, cap: policy.caps.deductions80C, allowed: d80cAllowed },
    { label: "NPS (80CCD(1B))", used: input.nps, cap: policy.caps.nps, allowed: npsAllowed },
    { label: "Home loan interest (24b)", used: input.homeLoanInterest, cap: policy.caps.homeLoanInterest, allowed: homeLoanAllowed },
    { label: "HRA", used: input.hra, allowed: input.hra },
    { label: "Standard deduction", used: standardDeduction, allowed: standardDeduction },
  ];

  const totalDeductions = deductionsBreakdown.reduce((sum, d) => sum + d.allowed, 0);
  const taxableIncome = Math.max(grossIncome - totalDeductions, 0);

  const rebateApplied = taxableIncome <= policy.rebate87AOldThreshold;
  if (rebateApplied) {
    return {
      regime: "Old Regime",
      financialYear: policy.financialYear,
      grossIncome,
      taxableIncome,
      totalDeductions,
      deductionsBreakdown,
      rebate87A: { threshold: policy.rebate87AOldThreshold, applied: true },
      slabBreakdown: [],
      taxBeforeCess: 0,
      cessAmount: 0,
      totalTax: 0,
      effectiveRatePct: grossIncome > 0 ? 0 : 0,
    };
  }

  const { tax: taxBeforeCess, breakdown } = applySlabsWithBreakdown(taxableIncome, policy.oldSlabs);
  const { totalTax, cessAmount } = applyCess(taxBeforeCess, policy);

  return {
    regime: "Old Regime",
    financialYear: policy.financialYear,
    grossIncome,
    taxableIncome,
    totalDeductions,
    deductionsBreakdown,
    rebate87A: { threshold: policy.rebate87AOldThreshold, applied: false },
    slabBreakdown: breakdown,
    taxBeforeCess,
    cessAmount,
    totalTax,
    effectiveRatePct: grossIncome > 0 ? Number(((totalTax / grossIncome) * 100).toFixed(2)) : 0,
  };
}

export function calculateNewRegime(input: IndiaTaxInput, financialYear: FinancialYear = "FY 2024-25"): TaxComputation {
  const policy = getPolicy(financialYear);
  const grossIncome = input.annualSalary + input.otherIncome;

  const deductionsBreakdown: DeductionLine[] = [
    { label: "Standard deduction", used: policy.standardDeduction, allowed: policy.standardDeduction },
  ];
  const totalDeductions = policy.standardDeduction;
  const taxableIncome = Math.max(grossIncome - totalDeductions, 0);

  const rebateApplied = taxableIncome <= policy.rebate87ANewThreshold;
  if (rebateApplied) {
    return {
      regime: "New Regime",
      financialYear: policy.financialYear,
      grossIncome,
      taxableIncome,
      totalDeductions,
      deductionsBreakdown,
      rebate87A: { threshold: policy.rebate87ANewThreshold, applied: true },
      slabBreakdown: [],
      taxBeforeCess: 0,
      cessAmount: 0,
      totalTax: 0,
      effectiveRatePct: grossIncome > 0 ? 0 : 0,
    };
  }

  const { tax: taxBeforeCess, breakdown } = applySlabsWithBreakdown(taxableIncome, policy.newSlabs);
  const { totalTax, cessAmount } = applyCess(taxBeforeCess, policy);

  return {
    regime: "New Regime",
    financialYear: policy.financialYear,
    grossIncome,
    taxableIncome,
    totalDeductions,
    deductionsBreakdown,
    rebate87A: { threshold: policy.rebate87ANewThreshold, applied: false },
    slabBreakdown: breakdown,
    taxBeforeCess,
    cessAmount,
    totalTax,
    effectiveRatePct: grossIncome > 0 ? Number(((totalTax / grossIncome) * 100).toFixed(2)) : 0,
  };
}

export function compareRegimes(
  input: IndiaTaxInput,
  financialYear: FinancialYear = "FY 2024-25"
): RegimeComparison {
  const policy = getPolicy(financialYear);
  const grossIncome = input.annualSalary + input.otherIncome;

  const oldRegime = calculateOldRegime(input, policy.financialYear);
  const newRegime = calculateNewRegime(input, policy.financialYear);

  const recommended: Regime = oldRegime.totalTax <= newRegime.totalTax ? "Old Regime" : "New Regime";
  const savings = Math.abs(oldRegime.totalTax - newRegime.totalTax);

  const deductionUsage = {
    section80C: {
      used: input.deductions80C,
      limit: policy.caps.deductions80C,
      remaining: Math.max(policy.caps.deductions80C - input.deductions80C, 0),
    },
    nps: {
      used: input.nps,
      limit: policy.caps.nps,
      remaining: Math.max(policy.caps.nps - input.nps, 0),
    },
    homeLoanInterest: {
      used: input.homeLoanInterest,
      limit: policy.caps.homeLoanInterest,
      remaining: Math.max(policy.caps.homeLoanInterest - input.homeLoanInterest, 0),
    },
  };

  return {
    financialYear: policy.financialYear,
    grossIncome,
    oldRegime,
    newRegime,
    recommended,
    savings,
    margin: savings,
    deductionUsage,
  };
}

