import type { FinancialYear } from "../../types/taxTypes";

export type Regime = "Old Regime" | "New Regime";

export interface Slab {
  upto: number;
  rate: number;
}

export interface TaxPolicy {
  financialYear: FinancialYear;
  cessRate: number;
  standardDeduction: number;
  rebate87AOldThreshold: number;
  rebate87ANewThreshold: number;
  oldSlabs: Slab[];
  newSlabs: Slab[];
  caps: {
    deductions80C: number;
    nps: number;
    homeLoanInterest: number;
  };
}

export const POLICY_FY_2024_25: TaxPolicy = {
  financialYear: "FY 2024-25",
  cessRate: 0.04,
  standardDeduction: 50_000,
  rebate87AOldThreshold: 500_000,
  rebate87ANewThreshold: 700_000,
  oldSlabs: [
    { upto: 250_000, rate: 0 },
    { upto: 500_000, rate: 0.05 },
    { upto: 1_000_000, rate: 0.2 },
    { upto: Number.POSITIVE_INFINITY, rate: 0.3 },
  ],
  newSlabs: [
    { upto: 300_000, rate: 0 },
    { upto: 600_000, rate: 0.05 },
    { upto: 900_000, rate: 0.1 },
    { upto: 1_200_000, rate: 0.15 },
    { upto: 1_500_000, rate: 0.2 },
    { upto: Number.POSITIVE_INFINITY, rate: 0.3 },
  ],
  caps: {
    deductions80C: 150_000,
    nps: 50_000,
    homeLoanInterest: 200_000,
  },
};

export function getPolicy(financialYear?: FinancialYear): TaxPolicy {
  if (!financialYear || financialYear === "FY 2024-25") return POLICY_FY_2024_25;
  return POLICY_FY_2024_25;
}
