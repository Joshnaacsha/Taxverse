import { CountryCode, IndiaTaxInput, UsaTaxInput, UkTaxInput, SgTaxInput, AeTaxInput } from "../../types/taxTypes";

export type AnyCountryInput = IndiaTaxInput | UsaTaxInput | UkTaxInput | SgTaxInput | AeTaxInput;

export function getAnnualIncome(country: CountryCode, input: AnyCountryInput): number {
  switch (country) {
    case "IN":
      return (input as IndiaTaxInput).annualSalary;
    case "US":
    case "UK":
    case "SG":
    case "AE":
      return (input as UsaTaxInput | UkTaxInput | SgTaxInput | AeTaxInput).annualIncome;
  }
}

export function setAnnualIncome(country: CountryCode, input: AnyCountryInput, annualIncome: number): AnyCountryInput {
  switch (country) {
    case "IN":
      return { ...(input as IndiaTaxInput), annualSalary: annualIncome };
    case "US":
      return { ...(input as UsaTaxInput), annualIncome };
    case "UK":
      return { ...(input as UkTaxInput), annualIncome };
    case "SG":
      return { ...(input as SgTaxInput), annualIncome };
    case "AE":
      return { ...(input as AeTaxInput), annualIncome };
  }
}

