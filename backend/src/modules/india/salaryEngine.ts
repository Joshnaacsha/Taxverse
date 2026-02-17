import type { IndiaTaxInput } from "../../types/taxTypes";
import type { IndiaSalaryBreakdown, IndiaSalaryInput, IndiaTdsPlan } from "../../types/salaryTypes";
import type { TaxReport } from "../tax/types";

function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}

export function buildIndiaSalaryBreakdown(input: IndiaSalaryInput): IndiaSalaryBreakdown {
  const grossMonthly =
    input.componentsMonthly.basic +
    input.componentsMonthly.hra +
    input.componentsMonthly.specialAllowance +
    input.componentsMonthly.otherAllowance +
    input.componentsMonthly.bonusMonthly;

  const deductionsMonthly =
    input.deductionsMonthly.employeePf +
    input.deductionsMonthly.professionalTax +
    input.deductionsMonthly.otherDeductions;

  const inHandMonthlyBeforeTax = grossMonthly - deductionsMonthly;

  return {
    grossMonthly: roundMoney(grossMonthly),
    deductionsMonthly: roundMoney(deductionsMonthly),
    inHandMonthlyBeforeTax: roundMoney(inHandMonthlyBeforeTax),
    annualGross: roundMoney(grossMonthly * 12),
    annualEmployeePf: roundMoney(input.deductionsMonthly.employeePf * 12),
    annualProfessionalTax: roundMoney(input.deductionsMonthly.professionalTax * 12),
    annualOtherDeductions: roundMoney(input.deductionsMonthly.otherDeductions * 12),
  };
}

export function deriveIndiaTaxInputFromSalary(input: IndiaSalaryInput): IndiaTaxInput {
  const annualGrossSalary =
    (input.componentsMonthly.basic +
      input.componentsMonthly.hra +
      input.componentsMonthly.specialAllowance +
      input.componentsMonthly.otherAllowance +
      input.componentsMonthly.bonusMonthly) *
    12;

  const annualHra = input.componentsMonthly.hra * 12;

  // NOTE: This project’s India calculator is simplified. We map common payroll
  // items into the existing IndiaTaxInput shape used by the demo engine.
  const employeePfAnnual = input.deductionsMonthly.employeePf * 12;
  const deductions80C = roundMoney(Math.max(0, input.investments80CAnnual + employeePfAnnual));

  return {
    annualSalary: roundMoney(annualGrossSalary),
    otherIncome: roundMoney(input.otherIncomeAnnual),
    deductions80C,
    hra: roundMoney(annualHra),
    homeLoanInterest: roundMoney(input.homeLoanInterestAnnual),
    nps: roundMoney(input.npsAnnual),
  };
}

export function buildIndiaTdsPlan(params: {
  report: TaxReport;
  tdsPaidYtd: number;
  monthsRemaining: number;
}): IndiaTdsPlan {
  const recommended = params.report.options.find((o) => o.id === params.report.recommendedOptionId) ?? params.report.options[0];
  const annualTaxPayable = roundMoney(recommended?.totalTax ?? 0);
  const taxPaidYtd = roundMoney(Math.max(0, params.tdsPaidYtd));
  const taxRemaining = roundMoney(Math.max(annualTaxPayable - taxPaidYtd, 0));
  const monthsRemaining = Math.max(0, Math.min(12, Math.trunc(params.monthsRemaining)));
  const suggestedMonthlyTdsFromNow = monthsRemaining > 0 ? roundMoney(taxRemaining / monthsRemaining) : 0;

  return {
    annualTaxPayable,
    taxPaidYtd,
    taxRemaining,
    monthsRemaining,
    suggestedMonthlyTdsFromNow,
  };
}

