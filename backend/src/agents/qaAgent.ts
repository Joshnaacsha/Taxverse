import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { QaResponseSchema } from "../api/schemas";
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
  if (firstBrace >= 0 && lastBrace > firstBrace) return text.slice(firstBrace, lastBrace + 1).trim();

  return null;
}

export async function answerWithContext(params: {
  context: unknown;
  question: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<{ answer: string; followUps?: string[]; error?: string }> {
  const llm = createLlm();
  if (!llm) {
    return { answer: "AI Q&A is disabled because GOOGLE_API_KEY is not set.", error: "missing_api_key" };
  }

  const historyText = (params.history ?? [])
    .slice(-12)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const prompt = `
You are RegimeIQ Q&A assistant for an India tax regime decision.

STRICT RULES:
- Use ONLY the provided CONTEXT (numbers, assumptions, fields). If missing, say you don't have it.
- Do NOT recalculate tax or invent numbers.
- Use plain, non-technical language that a normal user can understand.
- Be concise, practical, and directly answer the user.
- If relevant, include 1-2 future-focused suggestions (example: what to do next year to save better).

CONTEXT (JSON):
${JSON.stringify(params.context, null, 2)}

CHAT HISTORY (may be empty):
${historyText || "(none)"}

USER QUESTION:
${params.question}

Return ONLY valid JSON:
{
  "answer": "string",
  "followUps": ["optional suggestions (max 3)"]
}
`;

  const response = await llm.invoke(prompt);
  const content = String(response.content ?? "");
  const jsonString = extractJsonLike(content);
  if (!jsonString) {
    return { answer: content.trim() || "No answer returned.", error: "invalid_json" };
  }

  try {
    const parsed = JSON.parse(jsonString);
    const data = QaResponseSchema.parse(parsed);
    if (data.followUps && data.followUps.length > 3) data.followUps = data.followUps.slice(0, 3);
    return data;
  } catch {
    return { answer: content.trim() || "No answer returned.", error: "invalid_json" };
  }
}

