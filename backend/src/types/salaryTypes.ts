export type Currency = "INR";

export type SalaryInputMode = "manual" | "payslip_pdf";

export interface SalaryComponentsMonthly {
  basic: number;
  hra: number;
  specialAllowance: number;
  otherAllowance: number;
  bonusMonthly: number;
}

export interface SalaryDeductionsMonthly {
  employeePf: number;
  professionalTax: number;
  otherDeductions: number;
}

export interface IndiaSalaryInput {
  mode: SalaryInputMode;
  componentsMonthly: SalaryComponentsMonthly;
  deductionsMonthly: SalaryDeductionsMonthly;
  otherIncomeAnnual: number;
  investments80CAnnual: number;
  npsAnnual: number;
  homeLoanInterestAnnual: number;
  tdsPaidYtd: number;
  monthsRemaining: number;
  currency: Currency;
}

export interface IndiaSalaryBreakdown {
  grossMonthly: number;
  deductionsMonthly: number;
  inHandMonthlyBeforeTax: number;
  annualGross: number;
  annualEmployeePf: number;
  annualProfessionalTax: number;
  annualOtherDeductions: number;
}

export interface IndiaTdsPlan {
  annualTaxPayable: number;
  taxPaidYtd: number;
  taxRemaining: number;
  monthsRemaining: number;
  suggestedMonthlyTdsFromNow: number;
}

export interface ParsedPayslipFields {
  componentsMonthly?: Partial<SalaryComponentsMonthly>;
  deductionsMonthly?: Partial<SalaryDeductionsMonthly>;
  tdsPaidYtd?: number;
  notes?: string[];
  extractedTextPreview?: string;
  confidence: "low" | "medium" | "high";
}

