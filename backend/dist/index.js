"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const graph_1 = require("./graph/graph");
const input = {
    annualSalary: 60000 * 12,
    otherIncome: 1200000,
    deductions80C: 150000,
    nps: 50000,
    homeLoanInterest: 200000,
    hra: 100000,
};
(async () => {
    const result = await graph_1.taxGraph.invoke({
        userInput: input,
    });
    console.log("FINAL RESULT:");
    console.log(JSON.stringify(result, null, 2));
})();
