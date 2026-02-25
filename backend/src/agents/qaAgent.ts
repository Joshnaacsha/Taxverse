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

function detectCountryFromContext(context: unknown): string | null {
  if (!context || typeof context !== "object") return null;
  const report = (context as { report?: { country?: unknown } }).report;
  if (report && typeof report.country === "string") return report.country;
  return null;
}

function isFilingProcessQuestion(question: string): boolean {
  return /\b(file|filing|itr|return|submit|how to file|how do i file)\b/i.test(question);
}

function looksLikeContextRefusal(answer: string): boolean {
  return /\b(does not contain|don't have|do not have|missing|not available|cannot find)\b/i.test(answer);
}

function stripMarkdownArtifacts(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .trim();
}

function buildGenericFilingGuide(country: string | null): string {
  if (country === "IN" || country === null) {
    return [
      "Yes. Here is a practical India filing path:",
      "1. Choose the right ITR form (most salaried users use ITR-1; use ITR-2/3 if your income profile is more complex).",
      "2. Keep documents ready: Form 16, AIS/TIS, interest certificates, deduction proofs, bank details.",
      "3. Log in to the Income Tax e-Filing portal and prefill your return data.",
      "4. Verify salary, other income, deductions, and taxes paid (TDS/advance tax).",
      "5. Pay any balance tax due, then submit the return.",
      "6. Complete e-verification (Aadhaar OTP, net banking, or other supported method) to finish filing.",
      "If you want, I can give you a document checklist based on your exact profile before you file.",
    ].join("\n");
  }

  if (country === "US") {
    return [
      "Here is a practical US filing path:",
      "1. Gather forms (W-2/1099 and deduction/credit docs).",
      "2. Select filing status and confirm standard vs itemized deduction.",
      "3. Prepare federal return (and state return if applicable).",
      "4. Reconcile withholding/credits and pay balance due if any.",
      "5. E-file, keep acknowledgements, and store records.",
    ].join("\n");
  }

  if (country === "UK") {
    return [
      "Here is a practical UK filing path:",
      "1. Gather P60/P45 and other income records.",
      "2. Check if Self Assessment is required for your case.",
      "3. Complete return details, relief claims, and tax due.",
      "4. Submit by deadline and pay any balance due.",
      "5. Keep HMRC confirmations and supporting records.",
    ].join("\n");
  }

  if (country === "SG") {
    return [
      "Here is a practical Singapore filing path:",
      "1. Prepare income and relief documents.",
      "2. Verify auto-included income and relief eligibility.",
      "3. Submit return in IRAS portal before deadline.",
      "4. Review Notice of Assessment and payment plan if needed.",
      "5. Keep records for compliance.",
    ].join("\n");
  }

  if (country === "AE") {
    return [
      "For UAE, filing obligations depend on your exact profile.",
      "1. Confirm whether your case has any personal/business tax filing obligation.",
      "2. Check VAT/corporate-tax relevance if you have business income/entity structure.",
      "3. Prepare records and submit required declarations where applicable.",
      "4. Keep filing/payment evidence for compliance.",
    ].join("\n");
  }

  return "I can guide filing steps if you share your country first.";
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
- For questions about filing process (e.g., "how to file tax"), provide practical procedural steps for the detected country even if full steps are not in context.
- Keep filing-process guidance clearly labeled as general procedural guidance (not legal advice).
- Do not use markdown syntax in output (no **bold**, no markdown bullets).
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
    const country = detectCountryFromContext(params.context);
    const filingQuestion = isFilingProcessQuestion(params.question);

    data.answer = stripMarkdownArtifacts(data.answer);

    if (lastAssistantMessage) {
      const prev = normalizeForCompare(lastAssistantMessage);
      const next = normalizeForCompare(data.answer);
      if (prev && next && (prev === next || prev.includes(next) || next.includes(prev))) {
        data.answer =
          "Given your current inputs, there are no additional high-confidence tax-saving actions beyond what was already suggested. To unlock more options, update missing deduction inputs (if applicable) and plan next-year actions early.";
      }
    }

    if (filingQuestion && looksLikeContextRefusal(data.answer)) {
      data.answer = buildGenericFilingGuide(country);
    }

    if (data.followUps) {
      const uniq = Array.from(
        new Set(data.followUps.map((f) => stripMarkdownArtifacts(f).trim()).filter(Boolean)),
      );
      data.followUps = uniq.slice(0, 3);
    }
    return data;
  } catch {
    return { answer: content.trim() || "No answer returned.", error: "invalid_json" };
  }
}

