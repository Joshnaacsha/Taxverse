import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { TaxGraphState } from "./graphState";
import { compareRegimes } from "../modules/india/taxCalculator";
import { taxAnalysisAgent } from "../agents/taxAnalysisAgent";
import { simulateIncomeProjection } from "../modules/india/taxProjection";


const GraphAnnotation = Annotation.Root({
  userInput: Annotation<TaxGraphState["userInput"]>(),

  comparisonResult: Annotation<TaxGraphState["comparisonResult"]>({
    value: (x, y) => y ?? x,
    default: () => undefined,
  }),

  projection: Annotation<TaxGraphState["projection"]>({
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
graph.addNode("calculateTax", async (state: any) => {
  const comparisonResult = compareRegimes(state.userInput);

  // ✅ return ONLY what this node updates
  return {
    comparisonResult,
  };
});

graph.addNode("projectionNode", async (state: TaxGraphState) => {
  const projection = simulateIncomeProjection(state.userInput, 10, 3);

  return {
    projection,
  };
});

// ----------------------------
// Node 2: AI reasoning agent
// ----------------------------
graph.addNode("taxAnalysisAgent", async (state: any) => {
  return await taxAnalysisAgent(state);
});

// ----------------------------
// Graph flow
// ----------------------------
graph.addEdge(START, "calculateTax" as any);
graph.addEdge("calculateTax" as any, "projectionNode" as any);
graph.addEdge("projectionNode" as any, "taxAnalysisAgent" as any);

graph.addEdge("taxAnalysisAgent" as any, END as any);

export const taxGraph = graph.compile();
