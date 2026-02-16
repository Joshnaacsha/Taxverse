import { TaxGraphState } from "../../graph/graphState";
import { formatInr } from "../../util/format";

export interface ExecutiveSummary {
  headline: string;
  bullets: string[];
}

export function buildExecutiveSummary(state: TaxGraphState): ExecutiveSummary {
  const comparison = state.comparisonResult;
  const insights = state.insights;

  if (!comparison) {
    return {
      headline: "Run analysis to generate a decision summary.",
      bullets: [],
    };
  }

  const recommended = comparison.recommended;
  const savings = comparison.savings;

  const topLever = insights?.actionPlan?.[0];
  const flipSalary = insights?.flipPoints?.salaryFlip?.approxAnnualSalary;

  const headline = `${recommended} recommended • savings ${formatInr(savings)}`;

  const bullets: string[] = [];
  bullets.push(`Gross income: ${formatInr(comparison.grossIncome)}.`);
  bullets.push(
    `Old tax: ${formatInr(comparison.oldRegime.totalTax)} • New tax: ${formatInr(comparison.newRegime.totalTax)}.`
  );

  if (insights) {
    bullets.push(`Stability: ${insights.stability} — ${insights.stabilityReason}`);
  }

  if (topLever && topLever.deltaUsed > 0) {
    bullets.push(
      `Best next move: add ~${formatInr(topLever.deltaUsed)} to ${topLever.label} (est. ${formatInr(topLever.estimatedTaxSavedPer10k)} tax saved per ₹10k).`
    );
  }

  if (typeof flipSalary === "number" && Number.isFinite(flipSalary)) {
    bullets.push(`Approx salary flip-point: ${formatInr(flipSalary)} annual salary.`);
  }

  bullets.push("Note: HRA is simplified for demo; verify with real rules.");

  return { headline, bullets };
}

