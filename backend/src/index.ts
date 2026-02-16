import "dotenv/config";
import { taxGraph } from "./graph/graph";
import { IndiaTaxInput } from "./types/taxTypes";

const input: IndiaTaxInput = {
  annualSalary: 60000 * 12,
  otherIncome: 1200000,
  deductions80C: 150000,
  nps: 50000,
  homeLoanInterest: 200000,
  hra: 100000,
};

(async () => {
  const result = await taxGraph.invoke({
    country: "IN",
    userInput: input,
    options: {
      includeAi: false,
      projectionYears: 5,
      projectionGrowthRatePct: 10,
      scenarioCount: 8,
    },
  });

  console.log("FINAL RESULT:");
  console.log(JSON.stringify(result, null, 2));
})();
