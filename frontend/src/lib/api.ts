import type {
  AnalyzeResponse,
  AnyTaxInput,
  CountryCode,
  IndiaItrPrefill,
  IndiaPersonalInfo,
  IndiaTaxInput,
  PayslipParseResponse,
  QaMessage,
  QaResponse,
  SalaryAnalyzeResponse,
  SalaryComponentsMonthly,
  SalaryDeductionsMonthly,
} from "./types";

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

export async function parsePayslipPdf(params: {
  filename: string;
  mimeType: "application/pdf";
  dataBase64: string;
}): Promise<PayslipParseResponse> {
  const res = await fetch(`${API_BASE}/payslip/parse`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Payslip parse error (${res.status}): ${text || res.statusText}`);
  }

  return (await res.json()) as PayslipParseResponse;
}

export async function analyzeSalaryIndia(params: {
  mode: "manual" | "payslip_pdf";
  componentsMonthly: SalaryComponentsMonthly;
  deductionsMonthly: SalaryDeductionsMonthly;
  otherIncomeAnnual: number;
  investments80CAnnual: number;
  npsAnnual: number;
  homeLoanInterestAnnual: number;
  tdsPaidYtd: number;
  monthsRemaining: number;
}): Promise<SalaryAnalyzeResponse> {
  const res = await fetch(`${API_BASE}/salary/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Salary analyze error (${res.status}): ${text || res.statusText}`);
  }

  return (await res.json()) as SalaryAnalyzeResponse;
}

export async function prefillIndia(params: {
  input: IndiaTaxInput;
  personal?: IndiaPersonalInfo;
}): Promise<IndiaItrPrefill> {
  const res = await fetch(`${API_BASE}/prefill`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ country: "IN", ...params }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Prefill error (${res.status}): ${text || res.statusText}`);
  }

  return (await res.json()) as IndiaItrPrefill;
}
