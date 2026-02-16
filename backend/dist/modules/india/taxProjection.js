"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateIncomeProjection = simulateIncomeProjection;
const taxCalculator_1 = require("./taxCalculator");
function simulateIncomeProjection(input, years = 3, annualGrowthRatePct = 10) {
    const results = [];
    let currentSalary = input.annualSalary;
    for (let year = 1; year <= years; year++) {
        currentSalary = Math.round(currentSalary * (1 + annualGrowthRatePct / 100));
        const projectedInput = {
            ...input,
            annualSalary: currentSalary,
        };
        const comparison = (0, taxCalculator_1.compareRegimes)(projectedInput);
        results.push({
            year,
            annualSalary: currentSalary,
            grossIncome: comparison.grossIncome,
            recommended: comparison.recommended,
            oldTax: comparison.oldRegime.totalTax,
            newTax: comparison.newRegime.totalTax,
        });
    }
    return results;
}
