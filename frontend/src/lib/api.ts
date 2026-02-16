import type { AnalyzeResponse, AnyTaxInput, CountryCode, QaMessage, QaResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export async function analyzeTax(params: {
  country: CountryCode;
  input: AnyTaxInput;
  options?: {
    includeAi?: boolean;
    projectionYears?: number;
    projectionGrowthRatePct?: number;
    scenarioCount?: number;
  };
}): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Backend error (${res.status}): ${text || res.statusText}`);
  }

  return (await res.json()) as AnalyzeResponse;
}

export async function askQuestion(params: {
  context: unknown;
  question: string;
  history?: QaMessage[];
}): Promise<QaResponse> {
  const res = await fetch(`${API_BASE}/qa`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Q&A error (${res.status}): ${text || res.statusText}`);
  }

  return (await res.json()) as QaResponse;
}
