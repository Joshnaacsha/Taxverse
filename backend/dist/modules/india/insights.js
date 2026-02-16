"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildActionPlan = buildActionPlan;
exports.buildScenarios = buildScenarios;
exports.buildInsights = buildInsights;
const taxCalculator_1 = require("./taxCalculator");
function setAtMost(current, cap, add) {
    const allowedAdd = Math.max(Math.min(add, cap - current), 0);
    return { newValue: current + allowedAdd, used: allowedAdd };
}
function diffOldMinusNew(comparison) {
    return comparison.oldRegime.totalTax - comparison.newRegime.totalTax;
}
function computeStability(input) {
    const base = (0, taxCalculator_1.compareRegimes)(input);
    const baseDiff = diffOldMinusNew(base);
    const baseRecommended = base.recommended;
    const up = (0, taxCalculator_1.compareRegimes)({ ...input, annualSalary: Math.round(input.annualSalary * 1.01) });
    const down = (0, taxCalculator_1.compareRegimes)({ ...input, annualSalary: Math.round(input.annualSalary * 0.99) });
    if (up.recommended !== baseRecommended || down.recommended !== baseRecommended) {
        return {
            stability: "Low",
            reason: "Recommendation flips with ~1% income change; decision is highly sensitive.",
        };
    }
    const gross = Math.max(base.grossIncome, 1);
    const marginPct = (Math.abs(baseDiff) / gross) * 100;
    if (marginPct < 1.5) {
        return { stability: "Medium", reason: "Small tax margin relative to income; moderate sensitivity." };
    }
    return { stability: "High", reason: "Clear tax margin; recommendation is likely stable for small changes." };
}
function buildActionPlan(input) {
    const base = (0, taxCalculator_1.compareRegimes)(input);
    const usage = base.deductionUsage;
    const candidates = [
        { key: "deductions80C", label: "Section 80C", remaining: usage.section80C.remaining, cap: usage.section80C.limit, current: input.deductions80C },
        { key: "nps", label: "NPS (80CCD(1B))", remaining: usage.nps.remaining, cap: usage.nps.limit, current: input.nps },
        { key: "homeLoanInterest", label: "Home loan interest (24b)", remaining: usage.homeLoanInterest.remaining, cap: usage.homeLoanInterest.limit, current: input.homeLoanInterest },
    ].filter((c) => c.remaining > 0);
    const delta = 10000;
    const levers = candidates.map((c) => {
        const { newValue, used } = setAtMost(c.current, c.cap, delta);
        const modified = c.key === "deductions80C"
            ? { ...input, deductions80C: newValue }
            : c.key === "nps"
                ? { ...input, nps: newValue }
                : { ...input, homeLoanInterest: newValue };
        const after = (0, taxCalculator_1.compareRegimes)(modified);
        const oldSaved = base.oldRegime.totalTax - after.oldRegime.totalTax;
        const estimatedTaxSaved = Math.max(oldSaved, 0);
        return {
            key: c.key,
            label: c.label,
            remaining: c.remaining,
            deltaUsed: used,
            estimatedTaxSaved,
            estimatedTaxSavedPer10k: used > 0 ? Number(((estimatedTaxSaved / used) * 10000).toFixed(0)) : 0,
        };
    });
    return levers.sort((a, b) => b.estimatedTaxSavedPer10k - a.estimatedTaxSavedPer10k);
}
function findSalaryFlip(input) {
    const base = (0, taxCalculator_1.compareRegimes)(input);
    const baseSign = Math.sign(diffOldMinusNew(base));
    const current = Math.max(input.annualSalary, 1);
    const minSalary = Math.max(Math.round(current * 0.25), 0);
    const maxSalary = Math.max(Math.round(current * 3), minSalary + 1);
    const steps = 60;
    let prevSalary = minSalary;
    let prevSign = Math.sign(diffOldMinusNew((0, taxCalculator_1.compareRegimes)({ ...input, annualSalary: prevSalary })));
    for (let i = 1; i <= steps; i++) {
        const s = Math.round(minSalary + ((maxSalary - minSalary) * i) / steps);
        const sign = Math.sign(diffOldMinusNew((0, taxCalculator_1.compareRegimes)({ ...input, annualSalary: s })));
        if (sign === 0) {
            return {
                approxAnnualSalary: s,
                recommendedBelow: "Old Regime",
                recommendedAbove: "New Regime",
            };
        }
        if (sign !== prevSign) {
            // Binary search within [prevSalary, s]
            let lo = prevSalary;
            let hi = s;
            for (let iter = 0; iter < 20; iter++) {
                const mid = Math.round((lo + hi) / 2);
                const midSign = Math.sign(diffOldMinusNew((0, taxCalculator_1.compareRegimes)({ ...input, annualSalary: mid })));
                if (midSign === prevSign)
                    lo = mid;
                else
                    hi = mid;
            }
            const below = (0, taxCalculator_1.compareRegimes)({ ...input, annualSalary: lo }).recommended;
            const above = (0, taxCalculator_1.compareRegimes)({ ...input, annualSalary: hi }).recommended;
            return {
                approxAnnualSalary: hi,
                recommendedBelow: below,
                recommendedAbove: above,
            };
        }
        prevSalary = s;
        prevSign = sign;
    }
    // If base is exactly tied, treat as a "flip" at current salary
    if (baseSign === 0) {
        return {
            approxAnnualSalary: current,
            recommendedBelow: "Old Regime",
            recommendedAbove: "New Regime",
        };
    }
    return undefined;
}
function findDeductionsFlipToOld(input) {
    const base = (0, taxCalculator_1.compareRegimes)(input);
    if (base.recommended !== "New Regime")
        return undefined;
    const remaining80c = base.deductionUsage.section80C.remaining;
    const remainingNps = base.deductionUsage.nps.remaining;
    const remainingHome = base.deductionUsage.homeLoanInterest.remaining;
    const maxExtra = remaining80c + remainingNps + remainingHome;
    if (maxExtra <= 0)
        return undefined;
    const allocate = (extra) => {
        let remaining = extra;
        const add80c = Math.min(remaining80c, remaining);
        remaining -= add80c;
        const addNps = Math.min(remainingNps, remaining);
        remaining -= addNps;
        const addHome = Math.min(remainingHome, remaining);
        remaining -= addHome;
        return { deductions80C: add80c, nps: addNps, homeLoanInterest: addHome };
    };
    const winsOld = (extra) => {
        const alloc = allocate(extra);
        const comparison = (0, taxCalculator_1.compareRegimes)({
            ...input,
            deductions80C: input.deductions80C + alloc.deductions80C,
            nps: input.nps + alloc.nps,
            homeLoanInterest: input.homeLoanInterest + alloc.homeLoanInterest,
        });
        return comparison.recommended === "Old Regime";
    };
    if (!winsOld(maxExtra))
        return undefined;
    let lo = 0;
    let hi = maxExtra;
    for (let iter = 0; iter < 22; iter++) {
        const mid = Math.floor((lo + hi) / 2);
        if (winsOld(mid))
            hi = mid;
        else
            lo = mid + 1;
    }
    const allocation = allocate(hi);
    return { extraNeeded: hi, allocation };
}
function buildScenarios(input, count = 8) {
    const scenarios = [];
    const push = (name, description, i) => {
        scenarios.push({ name, description, input: i, comparison: (0, taxCalculator_1.compareRegimes)(i) });
    };
    push("Base", "Current inputs", input);
    push("Salary +10%", "Annual salary increased by 10%", { ...input, annualSalary: Math.round(input.annualSalary * 1.1) });
    push("Salary -10%", "Annual salary decreased by 10%", { ...input, annualSalary: Math.round(input.annualSalary * 0.9) });
    push("Other income +100k", "Additional other income of ₹100,000", { ...input, otherIncome: input.otherIncome + 100000 });
    push("Max 80C", "Max out Section 80C cap", { ...input, deductions80C: Math.max(input.deductions80C, 150000) });
    push("Max NPS", "Max out NPS (80CCD(1B)) cap", { ...input, nps: Math.max(input.nps, 50000) });
    push("Max home-loan interest", "Max out home-loan interest cap", { ...input, homeLoanInterest: Math.max(input.homeLoanInterest, 200000) });
    push("No deductions", "Set deductions to zero (for comparison)", { ...input, deductions80C: 0, nps: 0, homeLoanInterest: 0, hra: 0 });
    const base = scenarios[0]?.comparison;
    const sorted = scenarios
        .slice(0, count)
        .sort((a, b) => (base ? diffOldMinusNew(a.comparison) - diffOldMinusNew(b.comparison) : 0));
    return sorted;
}
function buildInsights(input, scenarioCount = 8) {
    const { stability, reason } = computeStability(input);
    const actionPlan = buildActionPlan(input);
    const salaryFlip = findSalaryFlip(input);
    const deductionsToFlipToOld = findDeductionsFlipToOld(input);
    const scenarios = buildScenarios(input, scenarioCount);
    return {
        stability,
        stabilityReason: reason,
        actionPlan,
        flipPoints: {
            salaryFlip,
            deductionsToFlipToOld,
        },
        scenarios,
    };
}
