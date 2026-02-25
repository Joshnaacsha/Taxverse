"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AeTaxInput,
  AnyTaxInput,
  CountryCode,
  IndiaTaxInput,
  SgTaxInput,
  UkTaxInput,
  UsaTaxInput,
} from "@/lib/types";
import { analyzeTax } from "@/lib/api";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { cn } from "@/lib/utils";
import { DollarSign, Briefcase, TrendingUp, AlertCircle, Zap } from "lucide-react";
import { uiTheme } from "@/lib/uiTheme";

const defaultIndiaInput: IndiaTaxInput = {
  annualSalary: 60000 * 12,
  otherIncome: 1_200_000,
  deductions80C: 150_000,
  nps: 50_000,
  homeLoanInterest: 200_000,
  hra: 100_000,
};

const defaultUsInput: UsaTaxInput = {
  annualIncome: 90_000,
  otherIncome: 5_000,
  filingStatus: "SINGLE",
  itemizedDeductions: 0,
};

const defaultUkInput: UkTaxInput = {
  annualIncome: 55_000,
  otherIncome: 0,
};

const defaultSgInput: SgTaxInput = {
  annualIncome: 80_000,
  otherIncome: 0,
};

const defaultAeInput: AeTaxInput = {
  annualIncome: 200_000,
  otherIncome: 0,
};

function defaultInputForCountry(country: CountryCode): AnyTaxInput {
  switch (country) {
    case "IN":
      return defaultIndiaInput;
    case "US":
      return defaultUsInput;
    case "UK":
      return defaultUkInput;
    case "SG":
      return defaultSgInput;
    case "AE":
      return defaultAeInput;
  }
}

function CTAButton(props: {
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
        "inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold",
        uiTheme.cta,
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
        {props.description ? (
          <div className={`text-xs ${uiTheme.textSubtle}`}>{props.description}</div>
        ) : null}
      </div>
      <input
        type="number"
        value={Number.isFinite(props.value) ? props.value : 0}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className={cn("h-10 rounded-xl px-3 text-sm", uiTheme.field)}
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
        {props.description ? (
          <div className={`text-xs ${uiTheme.textSubtle}`}>{props.description}</div>
        ) : null}
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

export function CalculatorPage() {
  const router = useRouter();
  const [country, setCountry] = useState<CountryCode>("IN");
  const [input, setInput] = useState<AnyTaxInput>(() => defaultInputForCountry("IN"));
  const [projectionYears, setProjectionYears] = useState(5);
  const [projectionGrowthRatePct, setProjectionGrowthRatePct] = useState(10);
  const [scenarioCount, setScenarioCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeTax({
        country,
        input,
        options: {
          includeAi: true,
          projectionYears,
          projectionGrowthRatePct,
          scenarioCount,
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
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const annualLabel = country === "IN" ? "Annual Salary" : "Annual Income";
  const annualValue = country === "IN" ? (input as IndiaTaxInput).annualSalary : (input as any).annualIncome;
  const setAnnualValue = (v: number) => {
    if (country === "IN") setInput({ ...(input as IndiaTaxInput), annualSalary: v });
    else setInput({ ...(input as any), annualIncome: v });
  };

  return (
    <AuroraBackground className="min-h-screen h-auto justify-start bg-[#020617] text-white">
      <div className={`${uiTheme.page} w-full pt-8 pb-12`}>
        <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Tax Calculator</h1>
          <p className={uiTheme.textMuted}>Multi-country calculator with AI explanation + Q&A</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <CardSpotlight className={`lg:col-span-2 rounded-2xl p-8 ${uiTheme.panel}`} radius={420}>
            <div className="relative z-10">
              <h2 className="text-xl font-semibold mb-6">Your Financial Profile</h2>

              <div className="mb-8">
                <div className={`flex items-center gap-2 text-sm font-semibold ${uiTheme.textMuted} uppercase tracking-wide mb-4`}>
                  <Zap className="w-4 h-4" />
                  Country
                </div>
                <SelectField
                  label="Country"
                  value={country}
                  onChange={(v) => {
                    const c = v as CountryCode;
                    setCountry(c);
                    setInput(defaultInputForCountry(c));
                  }}
                  options={[
                    { value: "IN", label: "India (regimes)" },
                    { value: "US", label: "United States (federal)" },
                    { value: "UK", label: "United Kingdom" },
                    { value: "SG", label: "Singapore" },
                    { value: "AE", label: "UAE" },
                  ]}
                  description="Choose your tax country"
                />
              </div>

              <div className="mb-8">
                <div className={`flex items-center gap-2 text-sm font-semibold ${uiTheme.textMuted} uppercase tracking-wide mb-4`}>
                  <DollarSign className="w-4 h-4" />
                  Income
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    label={annualLabel}
                    value={annualValue}
                    onChange={setAnnualValue}
                    description={country === "IN" ? "Salary + allowances" : "Earned income"}
                  />
                  <NumberField
                    label="Other Income"
                    value={(input as any).otherIncome}
                    onChange={(v) => setInput({ ...(input as any), otherIncome: v })}
                    description="Investments, interest, etc."
                  />
                </div>
              </div>

              <div className="mb-8">
                <div className={`flex items-center gap-2 text-sm font-semibold ${uiTheme.textMuted} uppercase tracking-wide mb-4`}>
                  <Briefcase className="w-4 h-4" />
                  Deductions / Settings
                </div>

                {country === "IN" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <NumberField
                      label="Section 80C"
                      value={(input as IndiaTaxInput).deductions80C}
                      onChange={(v) => setInput({ ...(input as IndiaTaxInput), deductions80C: v })}
                      description="Life insurance, ELSS, PPF"
                    />
                    <NumberField
                      label="NPS"
                      value={(input as IndiaTaxInput).nps}
                      onChange={(v) => setInput({ ...(input as IndiaTaxInput), nps: v })}
                      description="80CCD(1B) etc."
                    />
                    <NumberField
                      label="Home Loan Interest"
                      value={(input as IndiaTaxInput).homeLoanInterest}
                      onChange={(v) => setInput({ ...(input as IndiaTaxInput), homeLoanInterest: v })}
                      description="Section 24"
                    />
                    <NumberField
                      label="HRA"
                      value={(input as IndiaTaxInput).hra}
                      onChange={(v) => setInput({ ...(input as IndiaTaxInput), hra: v })}
                      description="Demo simplification"
                    />
                  </div>
                ) : country === "US" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Filing status"
                      value={(input as UsaTaxInput).filingStatus}
                      onChange={(v) => setInput({ ...(input as UsaTaxInput), filingStatus: v as UsaTaxInput["filingStatus"] })}
                      options={[
                        { value: "SINGLE", label: "Single" },
                        { value: "MFJ", label: "Married filing jointly" },
                        { value: "HOH", label: "Head of household" },
                      ]}
                      description="US federal"
                    />
                    <NumberField
                      label="Itemized deductions (optional)"
                      value={(input as UsaTaxInput).itemizedDeductions ?? 0}
                      onChange={(v) => setInput({ ...(input as UsaTaxInput), itemizedDeductions: v })}
                      description="Compare vs standard deduction"
                    />
                  </div>
                ) : (
                  <div className={`rounded-lg p-4 text-sm ${uiTheme.textMuted} ${uiTheme.panelSoft}`}>
                    No extra deduction inputs for this country in this calculator.
                  </div>
                )}
              </div>

              <div className={`mb-8 p-4 rounded-lg ${uiTheme.panelSoft}`}>
                <div className={`flex items-center gap-2 text-sm font-semibold ${uiTheme.textMuted} uppercase tracking-wide mb-4`}>
                  <TrendingUp className="w-4 h-4" />
                  Projections
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <NumberField
                    label="Years to Project"
                    value={projectionYears}
                    onChange={(v) => setProjectionYears(Math.max(1, Math.min(30, v)))}
                    description="1-30"
                  />
                  <NumberField
                    label="Annual Growth Rate"
                    value={projectionGrowthRatePct}
                    onChange={(v) => setProjectionGrowthRatePct(v)}
                    description="% per year"
                  />
                  <NumberField
                    label="Scenario Count"
                    value={scenarioCount}
                    onChange={(v) => setScenarioCount(Math.max(1, Math.min(20, v)))}
                    description="What-if"
                  />
                </div>
              </div>

              {error ? (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                  {error}
                </div>
              ) : null}

              <CTAButton onClick={onAnalyze} disabled={loading}>
                {loading ? "Analyzing..." : "Analyze Now"}
              </CTAButton>

              <div className={`mt-4 text-xs ${uiTheme.textSubtle}`}>
                AI analysis is enabled. If it returns "AI disabled", set GOOGLE_API_KEY in backend.
              </div>
            </div>
          </CardSpotlight>

          <CardSpotlight className={`rounded-2xl p-8 ${uiTheme.panel}`} radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-6">
                <AlertCircle className="w-5 h-5" />
                Tips
              </h3>

              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${uiTheme.panelSoft}`}>
                  <div className="text-sm font-medium mb-1">Keep it simple</div>
                  <p className={`text-xs ${uiTheme.textMuted}`}>Use this as planning guidance and verify with official rules.</p>
                </div>

                <div className={`p-4 rounded-lg ${uiTheme.panelSoft}`}>
                  <div className="text-sm font-medium mb-1">Compare options</div>
                  <p className={`text-xs ${uiTheme.textMuted}`}>Some countries show multiple options (e.g., India regimes, US standard vs itemized).</p>
                </div>

                <div className={`p-4 rounded-lg ${uiTheme.panelSoft}`}>
                  <div className="text-sm font-medium mb-1">Ask questions</div>
                  <p className={`text-xs ${uiTheme.textMuted}`}>Use Q&A after results to understand the recommendation.</p>
                </div>

                <div className={`p-4 rounded-lg ${uiTheme.panelSoft}`}>
                  <div className="text-sm font-medium mb-1">Audit trail</div>
                  <p className={`text-xs ${uiTheme.textMuted}`}>Check the breakdown tabs for slabs/deductions used.</p>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg border border-sky-300/30 bg-sky-500/12">
                <p className={`text-xs ${uiTheme.textMuted}`}>
                  <strong>Note:</strong> Verify with official sources before filing.
                </p>
              </div>
            </div>
          </CardSpotlight>
        </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
