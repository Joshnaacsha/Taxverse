"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taxGraph = void 0;
const langgraph_1 = require("@langchain/langgraph");
const taxAnalysisAgent_1 = require("../agents/taxAnalysisAgent");
const engine_1 = require("../modules/tax/engine");
const projection_1 = require("../modules/tax/projection");
const insights_1 = require("../modules/tax/insights");
const GraphAnnotation = langgraph_1.Annotation.Root({
    country: (0, langgraph_1.Annotation)(),
    userInput: (0, langgraph_1.Annotation)(),
    options: (0, langgraph_1.Annotation)({
        value: (x, y) => y ?? x,
        default: () => undefined,
    }),
    report: (0, langgraph_1.Annotation)({
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
    const report = (0, engine_1.buildTaxReport)(state.country, state.userInput);
    // ✅ return ONLY what this node updates
    return {
        report,
    };
});
graph.addNode("projectionNode", async (state) => {
    const years = state.options?.projectionYears ?? 3;
    const growthRatePct = state.options?.projectionGrowthRatePct ?? 10;
    const projection = (0, projection_1.simulateProjection)({
        country: state.country,
        input: state.userInput,
        years,
        annualGrowthRatePct: growthRatePct,
    });
    return {
        projection,
    };
});
graph.addNode("insightsNode", async (state) => {
    const scenarioCount = state.options?.scenarioCount ?? 8;
    const insights = (0, insights_1.buildTaxInsights)({
        country: state.country,
        input: state.userInput,
        scenarioCount,
    });
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
