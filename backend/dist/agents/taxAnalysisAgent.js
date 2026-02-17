"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taxAnalysisAgent = taxAnalysisAgent;
const google_genai_1 = require("@langchain/google-genai");
const schemas_1 = require("../api/schemas");
function createLlm() {
    if (!process.env.GOOGLE_API_KEY)
        return null;
    return new google_genai_1.ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        temperature: 0.2, // VERY important for finance
    });
}
function extractJsonLike(text) {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1])
        return fenced[1].trim();
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
        return text.slice(firstBrace, lastBrace + 1).trim();
    }
    return null;
}
async function taxAnalysisAgent(state) {
    if (state.options?.includeAi === false)
        return state;
    if (!state.report)
        return state;
    const llm = createLlm();
    if (!llm) {
        return {
            ...state,
            aiAnalysis: {
                summary: "AI explanation skipped (GOOGLE_API_KEY not set).",
                stability: "Low",
                futureWarning: "Set GOOGLE_API_KEY in your backend .env to enable AI.",
                actionableAdvice: [],
            },
        };
    }
    const prompt = `
You are a financial analysis assistant.

STRICT RULES:
- DO NOT calculate tax
- DO NOT modify numbers
- DO NOT add new assumptions
- ONLY explain and analyze the given data

DATA:
${JSON.stringify({
        report: state.report,
        projection: state.projection,
        insights: state.insights,
    }, null, 2)}

TASK:
1. Explain why the recommended regime is better
2. Decide stability: High / Medium / Low
3. Warn about future risks in plain language
4. Give actionable advice in plain language
5. Include future-focused saving tips (what to do next year)

Return ONLY valid JSON in this format:
{
  "summary": "",
  "stability": "High | Medium | Low",
  "futureWarning": "",
  "actionableAdvice": []
}
`;
    const response = await llm.invoke(prompt);
    const content = String(response.content ?? "");
    const jsonString = extractJsonLike(content);
    if (!jsonString) {
        return {
            ...state,
            aiAnalysis: {
                summary: "AI analysis unavailable (no JSON returned).",
                stability: "Low",
                futureWarning: "Re-run with includeAi=true, and verify your API key is set.",
                actionableAdvice: [],
            },
        };
    }
    try {
        const parsed = JSON.parse(jsonString);
        const aiAnalysis = schemas_1.AiAnalysisSchema.parse(parsed);
        return { ...state, aiAnalysis };
    }
    catch {
        return {
            ...state,
            aiAnalysis: {
                summary: "AI analysis unavailable (invalid JSON).",
                stability: "Low",
                futureWarning: "Try again; model output did not match required schema.",
                actionableAdvice: [],
            },
        };
    }
}
