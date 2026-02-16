"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taxGraph = void 0;
const langgraph_1 = require("@langchain/langgraph");
const taxCalculator_1 = require("../modules/india/taxCalculator");
const taxAnalysisAgent_1 = require("../agents/taxAnalysisAgent");
// ✅ 1. Define state schema using Annotation
const GraphAnnotation = langgraph_1.Annotation.Root({
    userInput: (0, langgraph_1.Annotation)(),
    comparisonResult: (0, langgraph_1.Annotation)({
        value: (x, y) => y ?? x,
        default: () => undefined,
    }),
    aiAnalysis: (0, langgraph_1.Annotation)({
        value: (x, y) => y ?? x,
        default: () => undefined,
    }),
});
const graph = new langgraph_1.StateGraph(GraphAnnotation);
// ----------------------------
// Node 1: Deterministic tax calculation
// ----------------------------
graph.addNode("calculateTax", async (state) => {
    const comparisonResult = (0, taxCalculator_1.compareRegimes)(state.userInput);
    // ✅ return ONLY what this node updates
    return {
        comparisonResult,
    };
});
// ----------------------------
// Node 2: AI reasoning agent
// ----------------------------
graph.addNode("taxAnalysisAgent", async (state) => {
    return await (0, taxAnalysisAgent_1.taxAnalysisAgent)(state);
});
// ----------------------------
// Graph flow
// ----------------------------
graph.addEdge(langgraph_1.START, "calculateTax");
graph.addEdge("calculateTax", "taxAnalysisAgent");
graph.addEdge("taxAnalysisAgent", langgraph_1.END);
exports.taxGraph = graph.compile();
