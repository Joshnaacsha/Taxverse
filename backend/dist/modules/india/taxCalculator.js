"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateOldRegime = calculateOldRegime;
exports.calculateNewRegime = calculateNewRegime;
exports.compareRegimes = compareRegimes;
const policy_1 = require("./policy");
function applySlabsWithBreakdown(income, slabs) {
    let tax = 0;
    let previous = 0;
    const breakdown = [];
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
        if (income <= to)
            break;
    }
    return { tax, breakdown };
}
function applyCess(taxBeforeCess, policy) {
    const cessAmount = taxBeforeCess * policy.cessRate;
    return { totalTax: taxBeforeCess + cessAmount, cessAmount };
}
function calculateOldRegime(input, financialYear = "FY 2024-25") {
    const policy = (0, policy_1.getPolicy)(financialYear);
    const grossIncome = input.annualSalary + input.otherIncome;
    const d80cAllowed = Math.min(input.deductions80C, policy.caps.deductions80C);
    const npsAllowed = Math.min(input.nps, policy.caps.nps);
    const homeLoanAllowed = Math.min(input.homeLoanInterest, policy.caps.homeLoanInterest);
    const standardDeduction = policy.standardDeduction;
    const deductionsBreakdown = [
        { label: "Section 80C", used: input.deductions80C, cap: policy.caps.deductions80C, allowed: d80cAllowed },
        { label: "NPS (80CCD(1B))", used: input.nps, cap: policy.caps.nps, allowed: npsAllowed },
        { label: "Home loan interest (24b)", used: input.homeLoanInterest, cap: policy.caps.homeLoanInterest, allowed: homeLoanAllowed },
        { label: "HRA", used: input.hra, allowed: input.hra },
        { label: "Standard deduction", used: standardDeduction, allowed: standardDeduction },
    ];
    const totalDeductions = deductionsBreakdown.reduce((sum, d) => sum + d.allowed, 0);
    const taxableIncome = Math.max(grossIncome - totalDeductions, 0);
    const rebateApplied = taxableIncome <= policy.rebate87AOldThreshold;
    if (rebateApplied) {
        return {
            regime: "Old Regime",
            financialYear: policy.financialYear,
            grossIncome,
            taxableIncome,
            totalDeductions,
            deductionsBreakdown,
            rebate87A: { threshold: policy.rebate87AOldThreshold, applied: true },
            slabBreakdown: [],
            taxBeforeCess: 0,
            cessAmount: 0,
            totalTax: 0,
            effectiveRatePct: grossIncome > 0 ? 0 : 0,
        };
    }
    const { tax: taxBeforeCess, breakdown } = applySlabsWithBreakdown(taxableIncome, policy.oldSlabs);
    const { totalTax, cessAmount } = applyCess(taxBeforeCess, policy);
    return {
        regime: "Old Regime",
        financialYear: policy.financialYear,
        grossIncome,
        taxableIncome,
        totalDeductions,
        deductionsBreakdown,
        rebate87A: { threshold: policy.rebate87AOldThreshold, applied: false },
        slabBreakdown: breakdown,
        taxBeforeCess,
        cessAmount,
        totalTax,
        effectiveRatePct: grossIncome > 0 ? Number(((totalTax / grossIncome) * 100).toFixed(2)) : 0,
    };
}
function calculateNewRegime(input, financialYear = "FY 2024-25") {
    const policy = (0, policy_1.getPolicy)(financialYear);
    const grossIncome = input.annualSalary + input.otherIncome;
    const deductionsBreakdown = [
        { label: "Standard deduction", used: policy.standardDeduction, allowed: policy.standardDeduction },
    ];
    const totalDeductions = policy.standardDeduction;
    const taxableIncome = Math.max(grossIncome - totalDeductions, 0);
    const rebateApplied = taxableIncome <= policy.rebate87ANewThreshold;
    if (rebateApplied) {
        return {
            regime: "New Regime",
            financialYear: policy.financialYear,
            grossIncome,
            taxableIncome,
            totalDeductions,
            deductionsBreakdown,
            rebate87A: { threshold: policy.rebate87ANewThreshold, applied: true },
            slabBreakdown: [],
            taxBeforeCess: 0,
            cessAmount: 0,
            totalTax: 0,
            effectiveRatePct: grossIncome > 0 ? 0 : 0,
        };
    }
    const { tax: taxBeforeCess, breakdown } = applySlabsWithBreakdown(taxableIncome, policy.newSlabs);
    const { totalTax, cessAmount } = applyCess(taxBeforeCess, policy);
    return {
        regime: "New Regime",
        financialYear: policy.financialYear,
        grossIncome,
        taxableIncome,
        totalDeductions,
        deductionsBreakdown,
        rebate87A: { threshold: policy.rebate87ANewThreshold, applied: false },
        slabBreakdown: breakdown,
        taxBeforeCess,
        cessAmount,
        totalTax,
        effectiveRatePct: grossIncome > 0 ? Number(((totalTax / grossIncome) * 100).toFixed(2)) : 0,
    };
}
function compareRegimes(input, financialYear = "FY 2024-25") {
    const policy = (0, policy_1.getPolicy)(financialYear);
    const grossIncome = input.annualSalary + input.otherIncome;
    const oldRegime = calculateOldRegime(input, policy.financialYear);
    const newRegime = calculateNewRegime(input, policy.financialYear);
    const recommended = oldRegime.totalTax <= newRegime.totalTax ? "Old Regime" : "New Regime";
    const savings = Math.abs(oldRegime.totalTax - newRegime.totalTax);
    const deductionUsage = {
        section80C: {
            used: input.deductions80C,
            limit: policy.caps.deductions80C,
            remaining: Math.max(policy.caps.deductions80C - input.deductions80C, 0),
        },
        nps: {
            used: input.nps,
            limit: policy.caps.nps,
            remaining: Math.max(policy.caps.nps - input.nps, 0),
        },
        homeLoanInterest: {
            used: input.homeLoanInterest,
            limit: policy.caps.homeLoanInterest,
            remaining: Math.max(policy.caps.homeLoanInterest - input.homeLoanInterest, 0),
        },
    };
    return {
        financialYear: policy.financialYear,
        grossIncome,
        oldRegime,
        newRegime,
        recommended,
        savings,
        margin: savings,
        deductionUsage,
    };
}
