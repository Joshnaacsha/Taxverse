"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { cn } from "@/lib/utils";
import { analyzeSalaryIndia, parsePayslipPdf } from "@/lib/api";
import type { PayslipParseResponse, SalaryComponentsMonthly, SalaryDeductionsMonthly } from "@/lib/types";
import { FileUp, AlertCircle, Calculator, Wand2 } from "lucide-react";

function PrimaryButton(props: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className={cn(
        "w-full rounded-xl px-6 py-3 text-sm font-semibold transition-colors",
        "bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 text-white",
        "hover:from-sky-400 hover:via-violet-400 hover:to-fuchsia-400",
        "disabled:opacity-50 disabled:pointer-events-none",
        props.className,
      )}
    >
      {props.children}
    </button>
  );
}

function NumberField(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  description?: string;
}) {
  return (
    <label className="grid gap-2">
      <div>
        <div className="text-sm font-medium text-white">{props.label}</div>
        {props.description ? <div className="text-xs text-white/50">{props.description}</div> : null}
      </div>
      <input
        type="number"
        value={Number.isFinite(props.value) ? props.value : 0}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-white/20"
      />
    </label>
  );
}

function clampNonNeg(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

async function fileToBase64(file: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const res = String(reader.result ?? "");
      const comma = res.indexOf(",");
      if (comma === -1) return reject(new Error("Unexpected file encoding"));
      resolve(res.slice(comma + 1));
    };
    reader.readAsDataURL(file);
  });
}

function applyParsed(
  parsed: PayslipParseResponse,
  components: SalaryComponentsMonthly,
  deductions: SalaryDeductionsMonthly,
) {
  return {
    components: {
      basic: parsed.componentsMonthly?.basic ?? components.basic,
      hra: parsed.componentsMonthly?.hra ?? components.hra,
      specialAllowance: parsed.componentsMonthly?.specialAllowance ?? components.specialAllowance,
      otherAllowance: parsed.componentsMonthly?.otherAllowance ?? components.otherAllowance,
      bonusMonthly: parsed.componentsMonthly?.bonusMonthly ?? components.bonusMonthly,
    },
    deductions: {
      employeePf: parsed.deductionsMonthly?.employeePf ?? deductions.employeePf,
      professionalTax: parsed.deductionsMonthly?.professionalTax ?? deductions.professionalTax,
      otherDeductions: parsed.deductionsMonthly?.otherDeductions ?? deductions.otherDeductions,
    },
    tdsPaidYtd: parsed.tdsPaidYtd,
  };
}

export function SalaryPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"upload" | "manual">("upload");

  const [components, setComponents] = useState<SalaryComponentsMonthly>({
    basic: 50_000,
    hra: 20_000,
    specialAllowance: 15_000,
    otherAllowance: 5_000,
    bonusMonthly: 0,
  });
  const [deductions, setDeductions] = useState<SalaryDeductionsMonthly>({
    employeePf: 6_000,
    professionalTax: 200,
    otherDeductions: 0,
  });

  const [otherIncomeAnnual, setOtherIncomeAnnual] = useState(0);
  const [investments80CAnnual, setInvestments80CAnnual] = useState(0);
  const [npsAnnual, setNpsAnnual] = useState(0);
  const [homeLoanInterestAnnual, setHomeLoanInterestAnnual] = useState(0);
  const [tdsPaidYtd, setTdsPaidYtd] = useState(0);
  const [monthsRemaining, setMonthsRemaining] = useState(2);

  const [parseLoading, setParseLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<PayslipParseResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grossMonthly = useMemo(() => {
    return (
      clampNonNeg(components.basic) +
      clampNonNeg(components.hra) +
      clampNonNeg(components.specialAllowance) +
      clampNonNeg(components.otherAllowance) +
      clampNonNeg(components.bonusMonthly)
    );
  }, [components]);

  const deductionsMonthly = useMemo(() => {
    return clampNonNeg(deductions.employeePf) + clampNonNeg(deductions.professionalTax) + clampNonNeg(deductions.otherDeductions);
  }, [deductions]);

  const inHandBeforeTax = useMemo(() => grossMonthly - deductionsMonthly, [grossMonthly, deductionsMonthly]);

  const fillSample = () => {
    setComponents({
      basic: 62_500,
      hra: 25_000,
      specialAllowance: 18_000,
      otherAllowance: 7_500,
      bonusMonthly: 10_000,
    });
    setDeductions({
      employeePf: 7_500,
      professionalTax: 200,
      otherDeductions: 800,
    });
    setOtherIncomeAnnual(30_000);
    setInvestments80CAnnual(60_000);
    setNpsAnnual(50_000);
    setHomeLoanInterestAnnual(0);
    setTdsPaidYtd(75_000);
    setMonthsRemaining(2);
    setParseResult(null);
    setParseError(null);
    setMode("manual");
  };

  const onUpload = async (file: File | null) => {
    if (!file) return;
    setParseLoading(true);
    setParseError(null);
    setParseResult(null);

    try {
      if (file.type !== "application/pdf") {
        throw new Error("Please upload a PDF payslip for auto-extraction.");
      }
      const dataBase64 = await fileToBase64(file);
      const parsed = await parsePayslipPdf({
        filename: file.name,
        mimeType: "application/pdf",
        dataBase64,
      });
      setParseResult(parsed);

      const applied = applyParsed(parsed, components, deductions);
      setComponents(applied.components);
      setDeductions(applied.deductions);
      if (typeof applied.tdsPaidYtd === "number") setTdsPaidYtd(applied.tdsPaidYtd);

      setMode("manual"); // always allow user to verify/edit
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Payslip parse failed");
      setMode("manual");
    } finally {
      setParseLoading(false);
    }
  };

  const onAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const r = await analyzeSalaryIndia({
        mode: parseResult ? "payslip_pdf" : "manual",
        componentsMonthly: {
          basic: clampNonNeg(components.basic),
          hra: clampNonNeg(components.hra),
          specialAllowance: clampNonNeg(components.specialAllowance),
          otherAllowance: clampNonNeg(components.otherAllowance),
          bonusMonthly: clampNonNeg(components.bonusMonthly),
        },
        deductionsMonthly: {
          employeePf: clampNonNeg(deductions.employeePf),
          professionalTax: clampNonNeg(deductions.professionalTax),
          otherDeductions: clampNonNeg(deductions.otherDeductions),
        },
        otherIncomeAnnual: clampNonNeg(otherIncomeAnnual),
        investments80CAnnual: clampNonNeg(investments80CAnnual),
        npsAnnual: clampNonNeg(npsAnnual),
        homeLoanInterestAnnual: clampNonNeg(homeLoanInterestAnnual),
        tdsPaidYtd: clampNonNeg(tdsPaidYtd),
        monthsRemaining: Math.max(0, Math.min(12, Math.trunc(monthsRemaining))),
      });

      if (typeof window !== "undefined") {
        sessionStorage.setItem("taxResult", JSON.stringify(r.analysis));
        sessionStorage.setItem("salaryResult", JSON.stringify(r.salary));
        sessionStorage.setItem("taxResult-IN", JSON.stringify(r.analysis));
        sessionStorage.setItem("taxInput-IN", JSON.stringify({ country: "IN", input: r.salary.derivedTaxInput }));
      }

      router.push("/results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Salary analyze failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black pt-10 pb-12 text-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
            <Wand2 className="w-3.5 h-3.5" /> India • Salary Slip → Take‑Home + Tax Plan
          </div>
          <h1 className="text-4xl font-bold mt-3">Salary Slip Analysis</h1>
          <p className="text-white/60 mt-2 max-w-2xl">
            Upload a PDF payslip to prefill values (best‑effort), or enter them manually. Then get Old vs New regime comparison and a TDS plan.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fillSample}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/80 hover:bg-white/10 transition-colors"
            >
              Use sample data
            </button>
            <div className="text-xs text-white/40 self-center">
              Sample uses realistic IT salary numbers (monthly) + common deductions.
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <CardSpotlight className="rounded-3xl border-white/10 bg-black/40 p-8" radius={520} enableEffect={false}>
            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setMode("upload")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm border transition-colors",
                    mode === "upload" ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-transparent text-white/70 hover:bg-white/5",
                  )}
                >
                  Upload Payslip (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => setMode("manual")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm border transition-colors",
                    mode === "manual" ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-transparent text-white/70 hover:bg-white/5",
                  )}
                >
                  Manual Entry
                </button>
              </div>

              {mode === "upload" ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-6">
                  <div className="flex items-center gap-2 font-semibold mb-2">
                    <FileUp className="w-5 h-5" /> Upload PDF Payslip
                  </div>
                  <p className="text-sm text-white/60 mb-4">
                    Auto-extraction works best on text-based PDFs. If parsing fails, you can still fill values manually.
                  </p>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-white/70 file:mr-4 file:rounded-lg file:border file:border-white/10 file:bg-white/5 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-white/10"
                    disabled={parseLoading}
                  />
                  {parseLoading ? <div className="mt-3 text-xs text-white/50">Parsing payslip…</div> : null}
                  {parseError ? (
                    <div className="mt-3 text-xs text-red-200 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      {parseError}
                    </div>
                  ) : null}
                  {parseResult?.notes?.length ? (
                    <div className="mt-3 text-xs text-white/60 bg-white/5 border border-white/10 rounded-lg p-3">
                      <div className="font-semibold mb-1">Parser notes (confidence: {parseResult.confidence})</div>
                      <ul className="list-disc pl-4 space-y-1">
                        {parseResult.notes.slice(0, 4).map((n) => (
                          <li key={n}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-6">
                <div>
                  <div className="text-sm font-semibold text-white/80 mb-3">Monthly earnings</div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <NumberField label="Basic" value={components.basic} onChange={(v) => setComponents((p) => ({ ...p, basic: v }))} />
                    <NumberField label="HRA" value={components.hra} onChange={(v) => setComponents((p) => ({ ...p, hra: v }))} />
                    <NumberField
                      label="Special allowance"
                      value={components.specialAllowance}
                      onChange={(v) => setComponents((p) => ({ ...p, specialAllowance: v }))}
                    />
                    <NumberField
                      label="Other allowance"
                      value={components.otherAllowance}
                      onChange={(v) => setComponents((p) => ({ ...p, otherAllowance: v }))}
                    />
                    <NumberField
                      label="Bonus (monthly avg)"
                      value={components.bonusMonthly}
                      onChange={(v) => setComponents((p) => ({ ...p, bonusMonthly: v }))}
                      description="If annual bonus, divide by 12"
                    />
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-white/80 mb-3">Monthly deductions (non-tax)</div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <NumberField
                      label="Employee PF"
                      value={deductions.employeePf}
                      onChange={(v) => setDeductions((p) => ({ ...p, employeePf: v }))}
                      description="Employee contribution only"
                    />
                    <NumberField
                      label="Professional tax"
                      value={deductions.professionalTax}
                      onChange={(v) => setDeductions((p) => ({ ...p, professionalTax: v }))}
                    />
                    <NumberField
                      label="Other deductions"
                      value={deductions.otherDeductions}
                      onChange={(v) => setDeductions((p) => ({ ...p, otherDeductions: v }))}
                      description="Insurance, meals, etc."
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-sm font-semibold text-white/80 mb-3">Tax inputs (annual)</div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <NumberField label="Other income" value={otherIncomeAnnual} onChange={setOtherIncomeAnnual} description="Interest, freelance, etc." />
                    <NumberField label="Investments under 80C (excluding PF)" value={investments80CAnnual} onChange={setInvestments80CAnnual} />
                    <NumberField label="NPS (80CCD(1B))" value={npsAnnual} onChange={setNpsAnnual} />
                    <NumberField label="Home loan interest (24B)" value={homeLoanInterestAnnual} onChange={setHomeLoanInterestAnnual} />
                    <NumberField label="TDS paid till now (YTD)" value={tdsPaidYtd} onChange={setTdsPaidYtd} />
                    <NumberField label="Months remaining (for TDS plan)" value={monthsRemaining} onChange={setMonthsRemaining} />
                  </div>
                  <div className="mt-3 text-xs text-white/50">
                    Note: India calculations are simplified for demo (as in this repo). Always verify with official rules.
                  </div>
                </div>

                {error ? (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                  </div>
                ) : null}

                <PrimaryButton onClick={onAnalyze} disabled={loading}>
                  <span className="inline-flex items-center gap-2">
                    <Calculator className="w-4 h-4" /> {loading ? "Analyzing…" : "Analyze Salary & Tax"}
                  </span>
                </PrimaryButton>
              </div>
            </div>
          </CardSpotlight>

          <CardSpotlight className="rounded-3xl border-white/10 bg-black/40 p-8" radius={520} enableEffect={false}>
            <div className="relative z-10">
              <div className="text-sm font-semibold text-white/80 mb-4">Preview (before tax)</div>
              <div className="grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs text-white/60 mb-1">Gross (monthly)</div>
                  <div className="text-2xl font-bold">{grossMonthly.toLocaleString("en-IN")}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs text-white/60 mb-1">Deductions (monthly)</div>
                  <div className="text-2xl font-bold">{deductionsMonthly.toLocaleString("en-IN")}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs text-white/60 mb-1">In‑hand (monthly, before tax)</div>
                  <div className="text-2xl font-bold">{inHandBeforeTax.toLocaleString("en-IN")}</div>
                  <div className="text-xs text-white/40 mt-2">After analysis, Results will show regime comparison + a TDS plan.</div>
                </div>
              </div>
            </div>
          </CardSpotlight>
        </div>
      </div>
    </div>
  );
}
