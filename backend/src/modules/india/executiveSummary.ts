import { TaxGraphState } from "../../graph/graphState";
import { formatMoney } from "../../util/format";

export interface ExecutiveSummary {
  headline: string;
  bullets: string[];
}

export function buildExecutiveSummary(state: TaxGraphState): ExecutiveSummary {
  const report = state.report;
  const insights = state.insights;

  if (!report) {
    return {
      headline: "Run analysis to generate a decision summary.",
      bullets: [],
    };
  }

  const recommendedOpt =
    report.options.find((o) => o.id === report.recommendedOptionId) ??
    report.options[0];
  const savings = report.savings;

  const topLever = insights?.actionPlan?.[0];
  const flipIncome = insights?.flipPoints?.earnedIncomeFlip?.approxAnnualIncome;

  const headline = `${recommendedOpt?.name ?? "Recommended"} • savings ${formatMoney(savings, report.currency)}`;

  const bullets: string[] = [];
  bullets.push(`${report.taxYear} • Country: ${report.country}.`);
  bullets.push(`Gross income: ${formatMoney(report.grossIncome, report.currency)}.`);
  bullets.push(
    `Best option tax: ${formatMoney(recommendedOpt?.totalTax ?? 0, report.currency)} (effective rate ${(recommendedOpt?.effectiveRatePct ?? 0).toFixed(2)}%).`
  );

  if (insights) {
    bullets.push(`Stability: ${insights.stability} — ${insights.stabilityReason}`);
  }

  if (topLever && topLever.deltaUsed > 0) {
    bullets.push(
      `Best next move: add ~${formatMoney(topLever.deltaUsed, report.currency)} to ${topLever.label} (est. ${formatMoney(topLever.estimatedTaxSavedPer10k, report.currency)} tax saved per 10k).`
    );
  }

  if (typeof flipIncome === "number" && Number.isFinite(flipIncome)) {
    bullets.push(`Approx flip-point: ${formatMoney(flipIncome, report.currency)} annual earned income.`);
  }

  bullets.push(...(report.notes?.slice(0, 2) ?? []));

  return { headline, bullets };
}
