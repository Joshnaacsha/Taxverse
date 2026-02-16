import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { TaxGraphState } from "./graphState";
import { compareRegimes } from "../modules/india/taxCalculator";
import { taxAnalysisAgent } from "../agents/taxAnalysisAgent";
import { simulateIncomeProjection } from "../modules/india/taxProjection";
import { buildInsights } from "../modules/india/insights";


const GraphAnnotation = Annotation.Root({
  userInput: Annotation<TaxGraphState["userInput"]>(),
  options: Annotation<TaxGraphState["options"]>({
    value: (x, y) => y ?? x,
    default: () => undefined,
  }),

  comparisonResult: Annotation<TaxGraphState["comparisonResult"]>({
    value: (x, y) => y ?? x,
    default: () => undefined,
  }),

  projection: Annotation<TaxGraphState["projection"]>({
    value: (x, y) => y ?? x,
    default: () => undefined,
  }),

  insights: Annotation<TaxGraphState["insights"]>({
    value: (x, y) => y ?? x,
    default: () => undefined,
  }),

  aiAnalysis: Annotation<TaxGraphState["aiAnalysis"]>({
    value: (x, y) => y ?? x,
    default: () => undefined,
  }),
});


const graph = new StateGraph(GraphAnnotation);

// ----------------------------
// Node 1: Deterministic tax calculation
// ----------------------------
graph.addNode("calculateTax", async (state: TaxGraphState) => {
  const comparisonResult = compareRegimes(state.userInput);

  // ✅ return ONLY what this node updates
  return {
    comparisonResult,
  };
});

graph.addNode("projectionNode", async (state: TaxGraphState) => {
  const years = state.options?.projectionYears ?? 3;
  const growthRatePct = state.options?.projectionGrowthRatePct ?? 10;
  const projection = simulateIncomeProjection(state.userInput, years, growthRatePct);

  return {
    projection,
  };
});

graph.addNode("insightsNode", async (state: TaxGraphState) => {
  const scenarioCount = state.options?.scenarioCount ?? 8;
  const insights = buildInsights(state.userInput, scenarioCount);

  return {
    insights,
  };
});

// ----------------------------
// Node 2: AI reasoning agent
// ----------------------------
graph.addNode("taxAnalysisAgent", async (state: TaxGraphState) => {
  return await taxAnalysisAgent(state);
});

// ----------------------------
// Graph flow
// ----------------------------
graph.addEdge(START, "calculateTax" as any);
graph.addEdge("calculateTax" as any, "projectionNode" as any);
graph.addEdge("projectionNode" as any, "insightsNode" as any);
graph.addEdge("insightsNode" as any, "taxAnalysisAgent" as any);

graph.addEdge("taxAnalysisAgent" as any, END as any);

export const taxGraph = graph.compile();
