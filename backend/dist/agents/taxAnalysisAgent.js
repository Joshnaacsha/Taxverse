"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taxAnalysisAgent = taxAnalysisAgent;
const google_genai_1 = require("@langchain/google-genai");
const llm = new google_genai_1.ChatGoogleGenerativeAI({
    model: "gemini-1.5-pro",
    temperature: 0.2, // VERY important for finance
});
async function taxAnalysisAgent(state) {
    if (!state.comparisonResult)
        return state;
    const prompt = `
You are a financial analysis assistant.

STRICT RULES:
- DO NOT calculate tax
- DO NOT modify numbers
- DO NOT add new assumptions
- ONLY explain and analyze the given data

DATA:
${JSON.stringify(state.comparisonResult, null, 2)}

TASK:
1. Explain why the recommended regime is better
2. Decide stability: High / Medium / Low
3. Warn about future risks
4. Give actionable advice

Return ONLY valid JSON in this format:
{
  "summary": "",
  "stability": "High | Medium | Low",
  "futureWarning": "",
  "actionableAdvice": []
}
`;
    const response = await llm.invoke(prompt);
    const aiAnalysis = JSON.parse(response.content);
    return {
        ...state,
        aiAnalysis,
    };
}
