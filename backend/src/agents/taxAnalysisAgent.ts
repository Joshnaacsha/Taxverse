import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { TaxGraphState } from "../graph/graphState";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0.2, // VERY important for finance
});

export async function taxAnalysisAgent(
  state: TaxGraphState
): Promise<TaxGraphState> {
  if (!state.comparisonResult) return state;

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

  // Extract JSON from markdown code blocks if present
  let jsonString = response.content as string;
  const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonString = jsonMatch[1];
  }

  const aiAnalysis = JSON.parse(jsonString);

  return {
    ...state,
    aiAnalysis,
  };
}
