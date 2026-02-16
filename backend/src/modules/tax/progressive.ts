import { TaxSlabLine } from "./types";

export interface Slab {
  upto: number;
  rate: number;
}

export function applySlabsWithBreakdown(
  income: number,
  slabs: Slab[]
): { tax: number; breakdown: TaxSlabLine[] } {
  let tax = 0;
  let previous = 0;
  const breakdown: TaxSlabLine[] = [];

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

