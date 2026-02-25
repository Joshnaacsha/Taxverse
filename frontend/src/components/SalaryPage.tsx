"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Spotlight } from "@/components/ui/spotlight";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { cn } from "@/lib/utils";
import { analyzeSalaryIndia, analyzeTax, parsePayslipPdf } from "@/lib/api";
import type {
  CountryCode,
  PayslipParseResponse,
  SalaryComponentsMonthly,
  SalaryDeductionsMonthly,
  UsaTaxInput,
} from "@/lib/types";
import { FileUp, AlertCircle, Calculator, Wand2 } from "lucide-react";
import { uiTheme } from "@/lib/uiTheme";

type NonIndiaCountry = Exclude<CountryCode, "IN">;

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
      className={cn("w-full rounded-xl px-6 py-3 text-sm font-semibold", uiTheme.cta, props.className)}
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
    <label className="grid min-w-0 gap-2">
      <div>
        <div className="text-sm font-medium text-white">{props.label}</div>
        {props.description ? <div className={`text-xs ${uiTheme.textSubtle}`}>{props.description}</div> : null}
      </div>
      <input
        type="number"
        value={Number.isFinite(props.value) ? props.value : 0}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className={cn("h-10 w-full min-w-0 rounded-xl px-3 text-sm", uiTheme.field)}
      />
    </label>
  );
}

function SelectField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  description?: string;
}) {
  return (
    <label className="grid gap-2">
      <div>
        <div className="text-sm font-medium text-white">{props.label}</div>
        {props.description ? <div className={`text-xs ${uiTheme.textSubtle}`}>{props.description}</div> : null}
      </div>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className={cn("h-10 rounded-xl px-3 text-sm", uiTheme.field)}
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value} className="bg-slate-900">
            {o.label}
          </option>
        ))}
      </select>
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
  deductions: SalaryDeductionsMonthly
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

const defaultAnnualIncomeByCountry: Record<NonIndiaCountry, number> = {
  US: 90000,
  UK: 55000,
  SG: 80000,
  AE: 200000,
};

const SAMPLE_COMPONENTS: SalaryComponentsMonthly = {
  basic: 62_500,
  hra: 25_000,
  specialAllowance: 18_000,
  otherAllowance: 7_500,
  bonusMonthly: 10_000,
};

const SAMPLE_DEDUCTIONS: SalaryDeductionsMonthly = {
  employeePf: 7_500,
  professionalTax: 200,
  otherDeductions: 800,
};

export function SalaryPage() {
  const router = useRouter();
  const [country, setCountry] = useState<CountryCode>("IN");

  const [mode, setMode] = useState<"upload" | "manual">("upload");
  const [components, setComponents] = useState<SalaryComponentsMonthly>(SAMPLE_COMPONENTS);
  const [deductions, setDeductions] = useState<SalaryDeductionsMonthly>(SAMPLE_DEDUCTIONS);
  const [otherIncomeAnnual, setOtherIncomeAnnual] = useState(30_000);
  const [investments80CAnnual, setInvestments80CAnnual] = useState(60_000);
  const [npsAnnual, setNpsAnnual] = useState(50_000);
  const [homeLoanInterestAnnual, setHomeLoanInterestAnnual] = useState(0);
  const [tdsPaidYtd, setTdsPaidYtd] = useState(75_000);
  const [monthsRemaining, setMonthsRemaining] = useState(2);
  const [parseLoading, setParseLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<PayslipParseResponse | null>(null);

  const [annualIncome, setAnnualIncome] = useState(90000);
  const [otherIncomeGlobal, setOtherIncomeGlobal] = useState(0);
  const [filingStatus, setFilingStatus] = useState<UsaTaxInput["filingStatus"]>("SINGLE");
  const [itemizedDeductions, setItemizedDeductions] = useState(0);
  const [projectionYears, setProjectionYears] = useState(5);
  const [projectionGrowthRatePct, setProjectionGrowthRatePct] = useState(10);
  const [scenarioCount, setScenarioCount] = useState(8);

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

  const validCountries: CountryCode[] = ["IN", "US", "UK", "SG", "AE"];

  const onCountryChange = (next: CountryCode) => {
    setCountry(next);
    setError(null);
    if (next !== "IN") {
      setAnnualIncome(defaultAnnualIncomeByCountry[next]);
      setOtherIncomeGlobal(0);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const countryFromQuery = new URLSearchParams(window.location.search).get("country");
    if (!countryFromQuery) return;
    const next = countryFromQuery.toUpperCase() as CountryCode;
    if (!validCountries.includes(next)) return;
    if (next === country) return;
    onCountryChange(next);
  }, [country]);

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

      setMode("manual");
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Payslip parse failed");
      setMode("manual");
    } finally {
      setParseLoading(false);
    }
  };

  const onAnalyzeIndia = async () => {
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
      setError(e instanceof Error ? e.message : "Salary analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const onAnalyzeGlobal = async () => {
    if (country === "IN") return;
    setLoading(true);
    setError(null);

    try {
      const input =
        country === "US"
          ? {
              annualIncome: clampNonNeg(annualIncome),
              otherIncome: clampNonNeg(otherIncomeGlobal),
              filingStatus,
              itemizedDeductions: clampNonNeg(itemizedDeductions),
            }
          : {
              annualIncome: clampNonNeg(annualIncome),
              otherIncome: clampNonNeg(otherIncomeGlobal),
            };

      const result = await analyzeTax({
        country,
        input,
        options: {
          includeAi: true,
          projectionYears: Math.max(1, Math.min(30, projectionYears)),
          projectionGrowthRatePct,
          scenarioCount: Math.max(1, Math.min(20, scenarioCount)),
        },
      });

      if (typeof window !== "undefined") {
        sessionStorage.setItem("taxResult", JSON.stringify(result));
        sessionStorage.setItem("taxInput", JSON.stringify({ country, input }));
        sessionStorage.setItem(`taxResult-${country}`, JSON.stringify(result));
        sessionStorage.setItem(`taxInput-${country}`, JSON.stringify({ country, input }));
      }
      router.push("/results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tax analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuroraBackground className="min-h-screen h-auto justify-start bg-[#020617] text-white">
      <div className={`${uiTheme.page} relative w-full overflow-hidden pb-12 pt-10 text-white`}>
        <Spotlight className="-top-56 left-0" fill="rgba(56, 189, 248, 0.35)" />
        <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-white/90 ${uiTheme.panelSoft}`}>
            <Wand2 className="h-3.5 w-3.5" /> Smart Tax Analysis
          </div>
          <h1 className="mt-3 text-4xl font-bold text-[#93c5fd]">
            Tax Calculator
          </h1>
          <p className={`${uiTheme.textMuted} mt-2 max-w-2xl`}>
            Use India salary slip upload/manual entry, or switch to another country for direct income-based calculation.
          </p>
        </div>

        <CardSpotlight className={`mb-6 rounded-2xl p-5 ${uiTheme.panel}`} radius={520}>
          <div className="relative z-10 grid gap-4 md:grid-cols-[1fr_2fr] md:items-end">
            <SelectField
              label="Country"
              value={country}
              onChange={(v) => onCountryChange(v as CountryCode)}
              options={[
                { value: "IN", label: "India (salary slip + manual)" },
                { value: "US", label: "United States" },
                { value: "UK", label: "United Kingdom" },
                { value: "SG", label: "Singapore" },
                { value: "AE", label: "UAE" },
              ]}
            />
            <div className="text-sm text-white/72">
              {country === "IN"
                ? "India mode includes salary upload, monthly breakdown, and TDS planning."
                : "Country mode runs direct annual-income analysis with projections and scenarios."}
            </div>
          </div>
        </CardSpotlight>

        {country === "IN" ? (
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <CardSpotlight className={`rounded-3xl p-8 ${uiTheme.panel}`} radius={520}>
              <div className="relative z-10">
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("upload")}
                    className={cn(
                      "w-full rounded-xl border px-4 py-2 text-sm transition-colors sm:w-auto",
                      mode === "upload" ? "border-sky-300/35 bg-sky-500/15 text-white" : "border-white/20 bg-transparent text-white/75 hover:bg-white/10"
                    )}
                  >
                    Upload Payslip (PDF)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("manual")}
                    className={cn(
                      "w-full rounded-xl border px-4 py-2 text-sm transition-colors sm:w-auto",
                      mode === "manual" ? "border-sky-300/35 bg-sky-500/15 text-white" : "border-white/20 bg-transparent text-white/75 hover:bg-white/10"
                    )}
                  >
                    Manual Entry
                  </button>
                </div>

                {mode === "upload" ? (
                  <div className={`mb-6 rounded-2xl p-6 ${uiTheme.panelSoft}`}>
                    <div className="mb-2 flex items-center gap-2 font-semibold">
                      <FileUp className="h-5 w-5" /> Upload PDF Payslip
                    </div>
                    <p className={`mb-4 text-sm ${uiTheme.textMuted}`}>
                      Auto-extraction works best on text-based PDFs. You can edit values before analysis.
                    </p>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-white/80 file:mr-4 file:rounded-lg file:border file:border-white/20 file:bg-slate-800/70 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700/80"
                      disabled={parseLoading}
                    />
                    {parseLoading ? <div className={`mt-3 text-xs ${uiTheme.textSubtle}`}>Parsing payslip...</div> : null}
                    {parseError ? <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200">{parseError}</div> : null}
                    {parseResult?.notes?.length ? (
                      <div className={`mt-3 rounded-lg p-3 text-xs ${uiTheme.textMuted} ${uiTheme.panelSoft}`}>
                        <div className="mb-1 font-semibold">Parser notes (confidence: {parseResult.confidence})</div>
                        <ul className="list-disc space-y-1 pl-4">
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
                    <div className="mb-3 text-sm font-semibold text-white/80">Monthly earnings</div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <NumberField label="Basic" value={components.basic} onChange={(v) => setComponents((p) => ({ ...p, basic: v }))} />
                      <NumberField label="HRA" value={components.hra} onChange={(v) => setComponents((p) => ({ ...p, hra: v }))} />
                      <NumberField label="Special allowance" value={components.specialAllowance} onChange={(v) => setComponents((p) => ({ ...p, specialAllowance: v }))} />
                      <NumberField label="Other allowance" value={components.otherAllowance} onChange={(v) => setComponents((p) => ({ ...p, otherAllowance: v }))} />
                      <NumberField label="Bonus (monthly avg)" value={components.bonusMonthly} onChange={(v) => setComponents((p) => ({ ...p, bonusMonthly: v }))} description="If annual bonus, divide by 12" />
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 text-sm font-semibold text-white/80">Monthly deductions (non-tax)</div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <NumberField label="Employee PF" value={deductions.employeePf} onChange={(v) => setDeductions((p) => ({ ...p, employeePf: v }))} description="Employee contribution only" />
                      <NumberField label="Professional tax" value={deductions.professionalTax} onChange={(v) => setDeductions((p) => ({ ...p, professionalTax: v }))} />
                      <NumberField label="Other deductions" value={deductions.otherDeductions} onChange={(v) => setDeductions((p) => ({ ...p, otherDeductions: v }))} description="Insurance, meals, etc." />
                    </div>
                  </div>

                  <div className={`rounded-2xl p-6 ${uiTheme.panelSoft}`}>
                    <div className="mb-3 text-sm font-semibold text-white/80">Tax inputs (annual)</div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <NumberField label="Other income" value={otherIncomeAnnual} onChange={setOtherIncomeAnnual} description="Interest, freelance, etc." />
                      <NumberField label="Investments under 80C (excluding PF)" value={investments80CAnnual} onChange={setInvestments80CAnnual} />
                      <NumberField label="NPS (80CCD(1B))" value={npsAnnual} onChange={setNpsAnnual} />
                      <NumberField label="Home loan interest (24B)" value={homeLoanInterestAnnual} onChange={setHomeLoanInterestAnnual} />
                      <NumberField label="TDS paid till now (YTD)" value={tdsPaidYtd} onChange={setTdsPaidYtd} />
                      <NumberField label="Months remaining (for TDS plan)" value={monthsRemaining} onChange={setMonthsRemaining} />
                    </div>
                    <div className={`mt-3 text-xs ${uiTheme.textSubtle}`}>Verify with official tax rules before filing.</div>
                  </div>

                  {error ? (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> {error}
                      </div>
                    </div>
                  ) : null}

                  <PrimaryButton onClick={onAnalyzeIndia} disabled={loading}>
                    <span className="inline-flex items-center gap-2">
                      <Calculator className="h-4 w-4" /> {loading ? "Analyzing..." : "Analyze Salary & Tax"}
                    </span>
                  </PrimaryButton>
                </div>
              </div>
            </CardSpotlight>

            <CardSpotlight className={`rounded-3xl p-8 ${uiTheme.panel}`} radius={520}>
              <div className="relative z-10">
                <div className="mb-4 text-sm font-semibold text-white/80">Preview (before tax)</div>
                <div className="grid gap-4">
                  <div className={`rounded-2xl p-5 ${uiTheme.panelSoft}`}>
                    <div className={`mb-1 text-xs ${uiTheme.textMuted}`}>Gross (monthly)</div>
                    <div className="text-2xl font-bold">{grossMonthly.toLocaleString("en-IN")}</div>
                  </div>
                  <div className={`rounded-2xl p-5 ${uiTheme.panelSoft}`}>
                    <div className={`mb-1 text-xs ${uiTheme.textMuted}`}>Deductions (monthly)</div>
                    <div className="text-2xl font-bold">{deductionsMonthly.toLocaleString("en-IN")}</div>
                  </div>
                  <div className={`rounded-2xl p-5 ${uiTheme.panelSoft}`}>
                    <div className={`mb-1 text-xs ${uiTheme.textMuted}`}>In-hand (monthly, before tax)</div>
                    <div className="text-2xl font-bold">{inHandBeforeTax.toLocaleString("en-IN")}</div>
                    <div className={`mt-2 text-xs ${uiTheme.textSubtle}`}>Results will include regime comparison and TDS planning.</div>
                  </div>
                </div>
              </div>
            </CardSpotlight>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <CardSpotlight className={`rounded-3xl p-8 ${uiTheme.panel}`} radius={520}>
              <div className="relative z-10 grid gap-6">
                <div>
                  <div className="mb-3 text-sm font-semibold text-white/80">Income</div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <NumberField label="Annual income" value={annualIncome} onChange={setAnnualIncome} />
                    <NumberField label="Other income" value={otherIncomeGlobal} onChange={setOtherIncomeGlobal} />
                  </div>
                </div>

                {country === "US" ? (
                  <div>
                    <div className="mb-3 text-sm font-semibold text-white/80">US settings</div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <SelectField
                        label="Filing status"
                        value={filingStatus}
                        onChange={(v) => setFilingStatus(v as UsaTaxInput["filingStatus"])}
                        options={[
                          { value: "SINGLE", label: "Single" },
                          { value: "MFJ", label: "Married filing jointly" },
                          { value: "HOH", label: "Head of household" },
                        ]}
                      />
                      <NumberField label="Itemized deductions (optional)" value={itemizedDeductions} onChange={setItemizedDeductions} />
                    </div>
                  </div>
                ) : null}

                <div className={`rounded-2xl p-6 ${uiTheme.panelSoft}`}>
                  <div className="mb-3 text-sm font-semibold text-white/80">Projections</div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <NumberField label="Years" value={projectionYears} onChange={setProjectionYears} description="1-30" />
                    <NumberField label="Growth rate (%)" value={projectionGrowthRatePct} onChange={setProjectionGrowthRatePct} />
                    <NumberField label="Scenario count" value={scenarioCount} onChange={setScenarioCount} description="1-20" />
                  </div>
                </div>

                {error ? (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" /> {error}
                    </div>
                  </div>
                ) : null}

                <PrimaryButton onClick={onAnalyzeGlobal} disabled={loading}>
                  <span className="inline-flex items-center gap-2">
                    <Calculator className="h-4 w-4" /> {loading ? "Analyzing..." : "Analyze Tax"}
                  </span>
                </PrimaryButton>
              </div>
            </CardSpotlight>

            <CardSpotlight className={`rounded-3xl p-8 ${uiTheme.panel}`} radius={520}>
              <div className="relative z-10">
                <div className="mb-4 text-sm font-semibold text-white/80">Summary</div>
                <div className="grid gap-4">
                  <div className={`rounded-2xl p-5 ${uiTheme.panelSoft}`}>
                    <div className={`mb-1 text-xs ${uiTheme.textMuted}`}>Country</div>
                    <div className="text-2xl font-bold">{country}</div>
                  </div>
                  <div className={`rounded-2xl p-5 ${uiTheme.panelSoft}`}>
                    <div className={`mb-1 text-xs ${uiTheme.textMuted}`}>Annual income</div>
                    <div className="text-2xl font-bold">{annualIncome.toLocaleString("en-US")}</div>
                  </div>
                  <div className={`rounded-2xl p-5 ${uiTheme.panelSoft}`}>
                    <div className={`mb-1 text-xs ${uiTheme.textMuted}`}>Other income</div>
                    <div className="text-2xl font-bold">{otherIncomeGlobal.toLocaleString("en-US")}</div>
                  </div>
                </div>
              </div>
            </CardSpotlight>
          </div>
        )}
        </div>
      </div>
    </AuroraBackground>
  );
}
