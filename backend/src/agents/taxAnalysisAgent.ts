import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { TaxGraphState } from "../graph/graphState";
import { AiAnalysisSchema } from "../api/schemas";
import dotenv from "dotenv";

dotenv.config();

function createLlm() {
  if (!process.env.GOOGLE_API_KEY) return null;
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.2, 
    apiKey: process.env.GOOGLE_API_KEY,
  });
}

function extractJsonLike(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1).trim();
  }

  return null;
}

function getResponseTextContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .join("\n")
      .trim();
  }
  return String(content ?? "");
}

export async function taxAnalysisAgent(
  state: TaxGraphState
): Promise<TaxGraphState> {
  if (state.options?.includeAi === false) return state;
  if (!state.report) return state;

  const llm = createLlm();
  if (!llm) {
    return {
      ...state,
      aiAnalysis: {
        summary: "AI explanation skipped (GOOGLE_API_KEY not set).",
        stability: "Low",
        futureWarning: "Set GOOGLE_API_KEY in your backend .env to enable AI.",
        thisYearActions: [],
        nextYearPlanning: [],
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
${JSON.stringify(
  {
    report: state.report,
    projection: state.projection,
    insights: state.insights,
  },
  null,
  2
)}

TASK:
1. Explain why the recommended regime is better, based ONLY on the given data
2. Decide stability: High / Medium / Low
3. Warn about future risks in plain language

4. List actions the user can STILL take in the CURRENT financial year
   - Focus on unused deductions, documentation, or timing
   - Do NOT assume new income or investments
   - These should be immediately actionable

5. List how the user should PLAN for the NEXT financial year
   - Focus on regime planning, income growth, and better preparation
   - Do NOT repeat current-year actions

Rules:
- Do NOT calculate tax
- Do NOT modify numbers
- Do NOT invent new deductions
- Base everything strictly on the provided data

Return ONLY valid JSON in this format:
{
  "summary": "",
  "stability": "High | Medium | Low",
  "futureWarning": "",
  "thisYearActions": [],
  "nextYearPlanning": []
}
`;

  const response = await llm.invoke(prompt);

  const content = getResponseTextContent(response.content);
  const jsonString = extractJsonLike(content);

  if (!jsonString) {
    return {
      ...state,
      aiAnalysis: {
        summary: "AI analysis unavailable (no JSON returned).",
        stability: "Low",
        futureWarning: "Re-run with includeAi=true, and verify your API key is set.",
        thisYearActions: [],
        nextYearPlanning: [],
      },
    };
  }

  try {
    const parsed = JSON.parse(jsonString);
    const raw = AiAnalysisSchema.parse(parsed);
    const aiAnalysis = {
      summary: raw.summary,
      stability: raw.stability,
      futureWarning: raw.futureWarning,
      thisYearActions: raw.thisYearActions.length ? raw.thisYearActions : (raw.actionableAdvice ?? []),
      nextYearPlanning: raw.nextYearPlanning,
    };
    return { ...state, aiAnalysis };
  } catch {
    return {
      ...state,
      aiAnalysis: {
        summary: "AI analysis unavailable (invalid JSON).",
        stability: "Low",
        futureWarning: "Try again; model output did not match required schema.",
        thisYearActions: [],
        nextYearPlanning: [],
      },
    };
  }
}
