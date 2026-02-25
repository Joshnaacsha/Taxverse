import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { QaResponseSchema } from "../api/schemas";
import dotenv from "dotenv";

dotenv.config();

function createLlm() {
  if (!process.env.GOOGLE_API_KEY) return null;
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.1,
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

function normalizeForCompare(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function buildContextBrief(context: unknown): string {
  if (!context || typeof context !== "object") return "No structured context available.";
  const c = context as Record<string, unknown>;
  const report = (c.report ?? {}) as Record<string, unknown>;
  const insights = (c.insights ?? {}) as Record<string, unknown>;
  const salary = (c.salary ?? {}) as Record<string, unknown>;

  const lines: string[] = [];
  if (typeof report.country === "string") lines.push(`Country: ${report.country}`);
  if (typeof report.taxYear === "string") lines.push(`Tax Year: ${report.taxYear}`);
  if (typeof report.recommendedOptionId === "string") lines.push(`Recommended Option ID: ${report.recommendedOptionId}`);
  if (typeof report.savings === "number") lines.push(`Estimated Savings: ${report.savings}`);
  if (typeof report.grossIncome === "number") lines.push(`Gross Income: ${report.grossIncome}`);

  if (typeof insights.stability === "string") lines.push(`Stability: ${insights.stability}`);
  if (typeof insights.stabilityReason === "string") lines.push(`Stability Reason: ${insights.stabilityReason}`);

  const tdsPlan = (salary.tdsPlan ?? {}) as Record<string, unknown>;
  if (typeof tdsPlan.taxRemaining === "number") lines.push(`TDS Remaining: ${tdsPlan.taxRemaining}`);
  if (typeof tdsPlan.suggestedMonthlyTdsFromNow === "number") {
    lines.push(`Suggested Monthly TDS: ${tdsPlan.suggestedMonthlyTdsFromNow}`);
  }

  return lines.length ? lines.join("\n") : "No high-signal summary fields found.";
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
  const lastAssistantMessage = [...(params.history ?? [])]
    .reverse()
    .find((m) => m.role === "assistant")?.content;
  const contextBrief = buildContextBrief(params.context);

  const prompt = `
You are Taxverse's senior tax decision copilot.

STRICT RULES:
- Use ONLY the provided CONTEXT (numbers, assumptions, fields). If missing, say you don't have it.
- Do NOT recalculate tax or invent numbers.
- Use plain language but expert-level reasoning.
- Be concise, practical, and directly answer the user.
- Quote specific values from context when useful.
- Prefer ranked, concrete actions over generic advice.
- If relevant, include 1-2 next-year planning ideas.
- Do NOT repeat the previous assistant answer verbatim.
- If the user asks for "anything else" / "other options" and no additional high-confidence action exists in context, explicitly say:
  - there are no additional tax-saving actions from current data, and
  - what new data or next-year planning could unlock more options.

ANSWER FORMAT (inside "answer" string):
1) Direct answer (1-2 lines)
2) Why this is true from context (specific values/fields)
3) What user should do next (numbered steps)
4) If data is missing, add one clarifying question

HIGH-SIGNAL CONTEXT SUMMARY:
${contextBrief}

FULL CONTEXT (JSON):
${JSON.stringify(params.context, null, 2)}

CHAT HISTORY (may be empty):
${historyText || "(none)"}

USER QUESTION (highest priority):
${params.question}

Return ONLY valid JSON:
{
  "answer": "string",
  "followUps": ["optional suggestions (max 3)"]
}
`;

  const response = await llm.invoke(prompt);
  const content = getResponseTextContent(response.content);
  const jsonString = extractJsonLike(content);
  if (!jsonString) {
    return { answer: content.trim() || "No answer returned.", error: "invalid_json" };
  }

  try {
    const parsed = JSON.parse(jsonString);
    const data = QaResponseSchema.parse(parsed);

    if (lastAssistantMessage) {
      const prev = normalizeForCompare(lastAssistantMessage);
      const next = normalizeForCompare(data.answer);
      if (prev && next && (prev === next || prev.includes(next) || next.includes(prev))) {
        data.answer =
          "Given your current inputs, there are no additional high-confidence tax-saving actions beyond what was already suggested. To unlock more options, update missing deduction inputs (if applicable) and plan next-year actions early.";
      }
    }

    if (data.followUps) {
      const uniq = Array.from(new Set(data.followUps.map((f) => f.trim()).filter(Boolean)));
      data.followUps = uniq.slice(0, 3);
    }
    return data;
  } catch {
    return { answer: content.trim() || "No answer returned.", error: "invalid_json" };
  }
}

