import { CountryCode, IndiaTaxInput, UsaTaxInput } from "../../types/taxTypes";
import { buildTaxReport } from "./engine";
import { AnyCountryInput, getAnnualIncome, setAnnualIncome } from "./inputUtils";
import { ActionItem, ScenarioResult, TaxInsights } from "./types";
import { buildActionPlan as buildIndiaActionPlan } from "../india/insights";

function computeStability(country: CountryCode, input: AnyCountryInput): { stability: TaxInsights["stability"]; reason: string } {
  const base = buildTaxReport(country as any, input as any);
  const baseRec = base.recommendedOptionId;

  const up = buildTaxReport(
    country as any,
    setAnnualIncome(country, input, Math.round(getAnnualIncome(country, input) * 1.01)) as any
  );
  const down = buildTaxReport(
    country as any,
    setAnnualIncome(country, input, Math.round(getAnnualIncome(country, input) * 0.99)) as any
  );

  if (up.recommendedOptionId !== baseRec || down.recommendedOptionId !== baseRec) {
    return {
      stability: "Low",
      reason: "A small income change can switch the recommendation, so recheck often.",
    };
  }

  const sorted = [...base.options].sort((a, b) => a.totalTax - b.totalTax);
  const best = sorted[0]!;
  const second = sorted[1];
  if (!second) {
    return { stability: "High", reason: "Only one option is available here, so the recommendation is stable." };
  }

  const gross = Math.max(base.grossIncome, 1);
  const marginPct = (Math.abs(second.totalTax - best.totalTax) / gross) * 100;
  if (marginPct < 1.5) return { stability: "Medium", reason: "The tax gap is small, so your best option may change with salary or deductions." };
  return { stability: "High", reason: "The tax gap is clear, so this recommendation should remain stable for small changes." };
}

function buildActionPlan(country: CountryCode, input: AnyCountryInput): ActionItem[] {
  if (country === "IN") {
    const levers = buildIndiaActionPlan(input as IndiaTaxInput);
    return levers.map((l) => ({
      key: l.key,
      label: l.label,
      deltaUsed: l.deltaUsed,
      estimatedTaxSaved: l.estimatedTaxSaved,
      estimatedTaxSavedPer10k: l.estimatedTaxSavedPer10k,
    }));
  }

  if (country === "US") {
    const i = input as UsaTaxInput;
    if (typeof i.itemizedDeductions !== "number") return [];
    const base = buildTaxReport("US", i);
    const baseItemized = base.options.find((o) => o.id === "itemized");
    if (!baseItemized) return [];

    const after = buildTaxReport("US", { ...i, itemizedDeductions: i.itemizedDeductions + 10_000 });
    const afterItemized = after.options.find((o) => o.id === "itemized");
    if (!afterItemized) return [];

    const estimatedTaxSaved = Math.max(baseItemized.totalTax - afterItemized.totalTax, 0);
    return [
      {
        key: "itemized_deductions",
        label: "Increase itemized deductions (if eligible)",
        deltaUsed: 10_000,
        estimatedTaxSaved,
        estimatedTaxSavedPer10k: Number(((estimatedTaxSaved / 10_000) * 10_000).toFixed(0)),
        notes: ["This is a marginal estimate on the itemized path."],
      },
    ];
  }

  return [];
}

function buildScenarios(country: CountryCode, input: AnyCountryInput, count: number): ScenarioResult[] {
  const scenarios: Array<{ name: string; description: string; input: AnyCountryInput }> = [];
  const annualIncome = getAnnualIncome(country, input);

  scenarios.push({ name: "Base", description: "Current inputs", input });
  scenarios.push({
    name: "Income +10%",
    description: "Earned income increased by 10%",
    input: setAnnualIncome(country, input, Math.round(annualIncome * 1.1)),
  });
  scenarios.push({
    name: "Income -10%",
    description: "Earned income decreased by 10%",
    input: setAnnualIncome(country, input, Math.round(annualIncome * 0.9)),
  });

  if (country === "IN") {
    const i = input as IndiaTaxInput;
    scenarios.push({ name: "Max 80C", description: "Max out Section 80C cap", input: { ...i, deductions80C: Math.max(i.deductions80C, 150_000) } });
    scenarios.push({ name: "Max NPS", description: "Max out NPS cap", input: { ...i, nps: Math.max(i.nps, 50_000) } });
  }

  if (country === "US") {
    const u = input as UsaTaxInput;
    scenarios.push({
      name: "Itemized +10k",
      description: "Increase itemized deductions by $10k",
      input: { ...u, itemizedDeductions: (u.itemizedDeductions ?? 0) + 10_000 },
    });
  }

  const built = scenarios.slice(0, count).map((s) => {
    const report = buildTaxReport(country as any, s.input as any);
    return {
      name: s.name,
      description: s.description,
      report: {
        grossIncome: report.grossIncome,
        options: report.options,
        recommendedOptionId: report.recommendedOptionId,
        savings: report.savings,
      },
    } satisfies ScenarioResult;
  });

  return built;
}

function findEarnedIncomeFlip(country: CountryCode, input: AnyCountryInput): TaxInsights["flipPoints"]["earnedIncomeFlip"] | undefined {
  const base = buildTaxReport(country as any, input as any);
  if (base.options.length < 2) return undefined;

  const current = Math.max(getAnnualIncome(country, input), 1);
  const minIncome = Math.max(Math.round(current * 0.25), 0);
  const maxIncome = Math.max(Math.round(current * 3), minIncome + 1);

  const sign = (income: number) => {
    const r = buildTaxReport(country as any, setAnnualIncome(country, input, income) as any);
    // Compare best vs second best by totalTax
    const sorted = [...r.options].sort((a, b) => a.totalTax - b.totalTax);
    if (sorted.length < 2) return 0;
    return Math.sign(sorted[0]!.totalTax - sorted[1]!.totalTax);
  };

  let prevIncome = minIncome;
  let prevRec = buildTaxReport(country as any, setAnnualIncome(country, input, prevIncome) as any).recommendedOptionId;

  const steps = 50;
  for (let i = 1; i <= steps; i++) {
    const s = Math.round(minIncome + ((maxIncome - minIncome) * i) / steps);
    const rec = buildTaxReport(country as any, setAnnualIncome(country, input, s) as any).recommendedOptionId;
    if (rec !== prevRec) {
      let lo = prevIncome;
      let hi = s;
      const belowRec = buildTaxReport(country as any, setAnnualIncome(country, input, lo) as any).recommendedOptionId;
      const aboveRecTarget = rec;

      for (let iter = 0; iter < 18; iter++) {
        const mid = Math.round((lo + hi) / 2);
        const midRec = buildTaxReport(country as any, setAnnualIncome(country, input, mid) as any).recommendedOptionId;
        if (midRec === belowRec) lo = mid;
        else hi = mid;
      }

      const below = buildTaxReport(country as any, setAnnualIncome(country, input, lo) as any).options.find((o) => o.id === belowRec)?.name ?? belowRec;
      const above = buildTaxReport(country as any, setAnnualIncome(country, input, hi) as any).options.find((o) => o.id === aboveRecTarget)?.name ?? aboveRecTarget;

      return {
        approxAnnualIncome: hi,
        recommendedBelow: below,
        recommendedAbove: above,
      };
    }
    prevIncome = s;
    prevRec = rec;
  }

  return undefined;
}

export function buildTaxInsights(params: {
  country: CountryCode;
  input: AnyCountryInput;
  scenarioCount: number;
}): TaxInsights {
  const { stability, reason } = computeStability(params.country, params.input);
  const actionPlan = buildActionPlan(params.country, params.input);
  const scenarios = buildScenarios(params.country, params.input, params.scenarioCount);
  const earnedIncomeFlip = findEarnedIncomeFlip(params.country, params.input);

  return {
    stability,
    stabilityReason: reason,
    actionPlan,
    flipPoints: {
      earnedIncomeFlip,
    },
    scenarios,
  };
}

