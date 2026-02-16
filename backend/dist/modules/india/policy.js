"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POLICY_FY_2024_25 = void 0;
exports.getPolicy = getPolicy;
exports.POLICY_FY_2024_25 = {
    financialYear: "FY 2024-25",
    cessRate: 0.04,
    standardDeduction: 50000,
    rebate87AOldThreshold: 500000,
    rebate87ANewThreshold: 700000,
    oldSlabs: [
        { upto: 250000, rate: 0 },
        { upto: 500000, rate: 0.05 },
        { upto: 1000000, rate: 0.2 },
        { upto: Number.POSITIVE_INFINITY, rate: 0.3 },
    ],
    newSlabs: [
        { upto: 300000, rate: 0 },
        { upto: 600000, rate: 0.05 },
        { upto: 900000, rate: 0.1 },
        { upto: 1200000, rate: 0.15 },
        { upto: 1500000, rate: 0.2 },
        { upto: Number.POSITIVE_INFINITY, rate: 0.3 },
    ],
    caps: {
        deductions80C: 150000,
        nps: 50000,
        homeLoanInterest: 200000,
    },
};
function getPolicy(financialYear) {
    if (!financialYear || financialYear === "FY 2024-25")
        return exports.POLICY_FY_2024_25;
    return exports.POLICY_FY_2024_25;
}
