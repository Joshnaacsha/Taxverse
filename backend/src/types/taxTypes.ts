export interface IndiaTaxInput {
  annualSalary: number;
  otherIncome: number;
  deductions80C: number;
  hra: number;
  homeLoanInterest: number;
  nps: number;
}

export type FinancialYear = "FY 2024-25";

export type CountryCode = "IN" | "US" | "UK" | "SG" | "AE";

export interface UsaTaxInput {
  annualIncome: number;
  otherIncome: number;
  filingStatus: "SINGLE" | "MFJ" | "HOH";
  itemizedDeductions?: number;
}

export interface UkTaxInput {
  annualIncome: number;
  otherIncome: number;
}

export interface SgTaxInput {
  annualIncome: number;
  otherIncome: number;
}

export interface AeTaxInput {
  annualIncome: number;
  otherIncome: number;
}

export type AnyTaxInput = IndiaTaxInput | UsaTaxInput | UkTaxInput | SgTaxInput | AeTaxInput;
