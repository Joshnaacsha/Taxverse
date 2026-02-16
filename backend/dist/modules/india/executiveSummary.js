"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildExecutiveSummary = buildExecutiveSummary;
const format_1 = require("../../util/format");
function buildExecutiveSummary(state) {
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
    const headline = `${recommended} recommended • savings ${(0, format_1.formatInr)(savings)}`;
    const bullets = [];
    bullets.push(`Gross income: ${(0, format_1.formatInr)(comparison.grossIncome)}.`);
    bullets.push(`Old tax: ${(0, format_1.formatInr)(comparison.oldRegime.totalTax)} • New tax: ${(0, format_1.formatInr)(comparison.newRegime.totalTax)}.`);
    if (insights) {
        bullets.push(`Stability: ${insights.stability} — ${insights.stabilityReason}`);
    }
    if (topLever && topLever.deltaUsed > 0) {
        bullets.push(`Best next move: add ~${(0, format_1.formatInr)(topLever.deltaUsed)} to ${topLever.label} (est. ${(0, format_1.formatInr)(topLever.estimatedTaxSavedPer10k)} tax saved per ₹10k).`);
    }
    if (typeof flipSalary === "number" && Number.isFinite(flipSalary)) {
        bullets.push(`Approx salary flip-point: ${(0, format_1.formatInr)(flipSalary)} annual salary.`);
    }
    bullets.push("Note: HRA is simplified for demo; verify with real rules.");
    return { headline, bullets };
}
