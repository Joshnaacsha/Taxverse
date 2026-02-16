"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taxGraph = void 0;
const langgraph_1 = require("@langchain/langgraph");
const taxCalculator_1 = require("../modules/india/taxCalculator");
const taxAnalysisAgent_1 = require("../agents/taxAnalysisAgent");
const taxProjection_1 = require("../modules/india/taxProjection");
const insights_1 = require("../modules/india/insights");
const GraphAnnotation = langgraph_1.Annotation.Root({
    userInput: (0, langgraph_1.Annotation)(),
    options: (0, langgraph_1.Annotation)({
        value: (x, y) => y ?? x,
        default: () => undefined,
    }),
    comparisonResult: (0, langgraph_1.Annotation)({
        value: (x, y) => y ?? x,
        default: () => undefined,
    }),
    projection: (0, langgraph_1.Annotation)({
        value: (x, y) => y ?? x,
        default: () => undefined,
    }),
    insights: (0, langgraph_1.Annotation)({
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
graph.addNode("projectionNode", async (state) => {
    const years = state.options?.projectionYears ?? 3;
    const growthRatePct = state.options?.projectionGrowthRatePct ?? 10;
    const projection = (0, taxProjection_1.simulateIncomeProjection)(state.userInput, years, growthRatePct);
    return {
        projection,
    };
});
graph.addNode("insightsNode", async (state) => {
    const scenarioCount = state.options?.scenarioCount ?? 8;
    const insights = (0, insights_1.buildInsights)(state.userInput, scenarioCount);
    return {
        insights,
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
graph.addEdge("calculateTax", "projectionNode");
graph.addEdge("projectionNode", "insightsNode");
graph.addEdge("insightsNode", "taxAnalysisAgent");
graph.addEdge("taxAnalysisAgent", langgraph_1.END);
exports.taxGraph = graph.compile();
