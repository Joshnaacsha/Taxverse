import pdfParse from "pdf-parse";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PayslipParseResponseSchema } from "../../api/schemas";

function createLlm() {
  if (!process.env.GOOGLE_API_KEY) return null;
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.1,
  });
}

function sanitizeText(text: string): string {
  return text
    .replace(/\u0000/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseMoneyLike(raw: string): number | null {
  const cleaned = raw.replace(/[,₹\s]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.round(n));
}

function firstMatchNumber(text: string, patterns: RegExp[]): number | null {
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) {
      const n = parseMoneyLike(m[1]);
      if (n !== null) return n;
    }
  }
  return null;
}

function heuristicExtract(text: string) {
  const t = text.toLowerCase();

  const basic = firstMatchNumber(t, [
    /\bbasic\b[^\d]{0,20}([\d,]+\.\d{1,2}|[\d,]+)/i,
    /\bbasic\s+pay\b[^\d]{0,20}([\d,]+\.\d{1,2}|[\d,]+)/i,
  ]);
  const hra = firstMatchNumber(t, [
    /\bhra\b[^\d]{0,20}([\d,]+\.\d{1,2}|[\d,]+)/i,
    /\bhouse\s+rent\s+allowance\b[^\d]{0,20}([\d,]+\.\d{1,2}|[\d,]+)/i,
  ]);
  const specialAllowance = firstMatchNumber(t, [
    /\bspecial\s+allowance\b[^\d]{0,20}([\d,]+\.\d{1,2}|[\d,]+)/i,
  ]);
  const otherAllowance = firstMatchNumber(t, [
    /\bother\s+allowance\b[^\d]{0,20}([\d,]+\.\d{1,2}|[\d,]+)/i,
    /\bflexi\b[^\d]{0,20}([\d,]+\.\d{1,2}|[\d,]+)/i,
  ]);
  const bonusMonthly = firstMatchNumber(t, [
    /\bbonus\b[^\d]{0,20}([\d,]+\.\d{1,2}|[\d,]+)/i,
    /\bvariable\b[^\d]{0,20}([\d,]+\.\d{1,2}|[\d,]+)/i,
  ]);

  const employeePf = firstMatchNumber(t, [
    /\bpf\b[^\d]{0,20}([\d,]+\.\d{1,2}|[\d,]+)/i,
    /\bepf\b[^\d]{0,20}([\d,]+\.\d{1,2}|[\d,]+)/i,
    /\bprovident\s+fund\b[^\d]{0,20}([\d,]+\.\d{1,2}|[\d,]+)/i,
  ]);
  const professionalTax = firstMatchNumber(t, [
    /\bprofessional\s+tax\b[^\d]{0,20}([\d,]+\.\d{1,2}|[\d,]+)/i,
    /\bpt\b[^\d]{0,10}([\d,]+\.\d{1,2}|[\d,]+)/i,
  ]);
  const tdsPaidYtd = firstMatchNumber(t, [
    /\btds\b[^\d]{0,30}\b(ytd|year\s*to\s*date)\b[^\d]{0,20}([\d,]+\.\d{1,2}|[\d,]+)/i,
    /\bincome\s+tax\b[^\d]{0,30}\b(ytd|year\s*to\s*date)\b[^\d]{0,20}([\d,]+\.\d{1,2}|[\d,]+)/i,
  ]);

  return {
    componentsMonthly: {
      basic: basic ?? undefined,
      hra: hra ?? undefined,
      specialAllowance: specialAllowance ?? undefined,
      otherAllowance: otherAllowance ?? undefined,
      bonusMonthly: bonusMonthly ?? undefined,
    },
    deductionsMonthly: {
      employeePf: employeePf ?? undefined,
      professionalTax: professionalTax ?? undefined,
      otherDeductions: undefined,
    },
    tdsPaidYtd: tdsPaidYtd ?? undefined,
  };
}

export async function parsePayslipPdf(params: {
  filename: string;
  dataBase64: string;
}): Promise<{
  confidence: "low" | "medium" | "high";
  componentsMonthly?: Record<string, number | undefined>;
  deductionsMonthly?: Record<string, number | undefined>;
  tdsPaidYtd?: number;
  notes?: string[];
  extractedTextPreview?: string;
}> {
  const rawBytes = Buffer.from(params.dataBase64, "base64");
  const maxBytes = 3.5 * 1024 * 1024; // keep demo safe
  if (rawBytes.byteLength > maxBytes) {
    return {
      confidence: "low",
      notes: ["Payslip file too large for demo parsing. Please use manual entry."],
    };
  }

  const parsed = await pdfParse(rawBytes);
  const extractedText = sanitizeText(String(parsed.text ?? ""));
  const extractedTextPreview = extractedText.slice(0, 2500);

  const heuristic = heuristicExtract(extractedText);
  const heurCount =
    Object.values(heuristic.componentsMonthly).filter(Boolean).length +
    Object.values(heuristic.deductionsMonthly).filter(Boolean).length +
    (heuristic.tdsPaidYtd ? 1 : 0);

  let result: any = {
    confidence: heurCount >= 4 ? "medium" : "low",
    ...heuristic,
    notes: [
      "Auto-extraction is best-effort; please verify values.",
      ...(heurCount === 0 ? ["Could not detect fields reliably; fill manually."] : []),
    ],
    extractedTextPreview,
  };

  const llm = createLlm();
  if (llm && extractedText.length) {
    const prompt = `
Extract monthly salary components and deductions from this payslip TEXT.

Return ONLY valid JSON in this exact shape (omit unknown fields):
{
  "confidence": "low|medium|high",
  "componentsMonthly": { "basic": 0, "hra": 0, "specialAllowance": 0, "otherAllowance": 0, "bonusMonthly": 0 },
  "deductionsMonthly": { "employeePf": 0, "professionalTax": 0, "otherDeductions": 0 },
  "tdsPaidYtd": 0,
  "notes": ["..."],
  "extractedTextPreview": ""
}

Rules:
- Prefer numeric amounts that look like 'Earnings' / 'Deductions' monthly values.
- If the slip shows annual-only numbers, set confidence=low and add a note.
- Do not hallucinate. If unsure, omit the field.

PAYSLIP TEXT:
${extractedTextPreview}
`;

    const response = await llm.invoke(prompt);
    const content = String(response.content ?? "");
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const jsonString = fenced?.[1]?.trim() ?? content.trim();
    try {
      const obj = JSON.parse(jsonString);
      const validated = PayslipParseResponseSchema.parse(obj);
      result = {
        ...validated,
        extractedTextPreview,
        notes: [...(validated.notes ?? []), "Auto-extraction is best-effort; please verify values."],
      };
    } catch {
      // keep heuristic result
      result.notes = [...(result.notes ?? []), "AI extraction failed; using heuristic extraction."];
    }
  }

  return result;
}

