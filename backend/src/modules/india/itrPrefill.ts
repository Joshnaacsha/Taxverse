import type { IndiaTaxInput } from "../../types/taxTypes";
import { getPolicy } from "./policy";

export interface PrefillField {
  key: string;
  label: string;
  value: string | number | null;
}

export interface PrefillSection {
  name: string;
  fields: PrefillField[];
}

export interface IndiaItrPrefill {
  country: "IN";
  form: string;
  financialYear: string;
  sections: PrefillSection[];
  notes: string[];
}

export function buildIndiaItrPrefill(
  input: IndiaTaxInput,
  personal?: {
    fullName?: string;
    pan?: string;
    dateOfBirth?: string;
    email?: string;
    phone?: string;
    address?: string;
  }
): IndiaItrPrefill {
  const policy = getPolicy();
  const grossSalary = input.annualSalary;
  const otherIncome = input.otherIncome;
  const grossTotalIncome = grossSalary + otherIncome;

  const deductions80CAllowed = Math.min(input.deductions80C, policy.caps.deductions80C);
  const npsAllowed = Math.min(input.nps, policy.caps.nps);
  const homeLoanAllowed = Math.min(input.homeLoanInterest, policy.caps.homeLoanInterest);

  const totalDeductionsOldRegime =
    deductions80CAllowed + npsAllowed + homeLoanAllowed + input.hra + policy.standardDeduction;

  return {
    country: "IN",
    form: "ITR-1 (Sahaj) - simplified",
    financialYear: policy.financialYear,
    sections: [
      {
        name: "Personal Info",
        fields: [
          { key: "fullName", label: "Full Name", value: personal?.fullName ?? null },
          { key: "pan", label: "PAN", value: personal?.pan ?? null },
          { key: "dateOfBirth", label: "Date of Birth", value: personal?.dateOfBirth ?? null },
          { key: "email", label: "Email", value: personal?.email ?? null },
          { key: "phone", label: "Phone", value: personal?.phone ?? null },
          { key: "address", label: "Address", value: personal?.address ?? null },
        ],
      },
      {
        name: "Income",
        fields: [
          { key: "grossSalary", label: "Income from Salary", value: grossSalary },
          { key: "otherIncome", label: "Income from Other Sources", value: otherIncome },
          { key: "grossTotalIncome", label: "Gross Total Income", value: grossTotalIncome },
        ],
      },
      {
        name: "Deductions/Exemptions (Old Regime)",
        fields: [
          { key: "deductions80C", label: "Section 80C (allowed)", value: deductions80CAllowed },
          { key: "nps", label: "NPS 80CCD(1B) (allowed)", value: npsAllowed },
          { key: "homeLoanInterest", label: "Home Loan Interest 24(b) (allowed)", value: homeLoanAllowed },
          { key: "hra", label: "HRA Exemption (simplified)", value: input.hra },
          { key: "standardDeduction", label: "Standard Deduction", value: policy.standardDeduction },
          { key: "totalDeductionsOld", label: "Total Deductions (Old Regime)", value: totalDeductionsOldRegime },
        ],
      },
    ],
    notes: [
      "This is a simplified ITR-1 prefill for demo purposes.",
      "Section 80C/NPS/Home loan interest are capped to policy limits.",
      "HRA is treated as a direct exemption as in the current estimator.",
    ],
  };
}
