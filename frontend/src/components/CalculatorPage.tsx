"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { IndiaTaxInput } from "@/lib/types";
import { analyzeTax } from "@/lib/api";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { NoiseBackground } from "@/components/ui/noise-background";
import { cn } from "@/lib/utils";
import { DollarSign, Briefcase, TrendingUp, AlertCircle, Zap } from "lucide-react";

const defaultInput: IndiaTaxInput = {
  annualSalary: 60000 * 12,
  otherIncome: 1_200_000,
  deductions80C: 150_000,
  nps: 50_000,
  homeLoanInterest: 200_000,
  hra: 100_000,
};

function NoiseButton(props: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <NoiseBackground
      containerClassName={cn(
        "inline-block rounded-xl p-1",
        props.disabled && "opacity-50 pointer-events-none",
        props.className
      )}
      className="p-0"
      gradientColors={["rgb(56, 189, 248)", "rgb(168, 85, 247)", "rgb(236, 72, 153)"]}
      noiseIntensity={0.22}
      speed={0.13}
      backdropBlur
    >
      <button
        type="button"
        onClick={props.onClick}
        disabled={props.disabled}
        className="w-full rounded-[0.7rem] bg-black/80 font-semibold text-white ring-1 ring-white/10 hover:bg-black/60 transition-colors px-6 py-3"
      >
        {props.children}
      </button>
    </NoiseBackground>
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
        {props.description && (
          <div className="text-xs text-white/50">{props.description}</div>
        )}
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

export function CalculatorPage() {
  const router = useRouter();
  const [input, setInput] = useState<IndiaTaxInput>(defaultInput);
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
        input,
        options: {
          includeAi: true,
          projectionYears,
          projectionGrowthRatePct,
          scenarioCount,
        },
      });

      // Store in sessionStorage for results page
      if (typeof window !== "undefined") {
        sessionStorage.setItem("taxResult", JSON.stringify(result));
        sessionStorage.setItem("taxInput", JSON.stringify(input));
      }

      router.push("/results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black pt-8 pb-12">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Tax Calculator</h1>
          <p className="text-white/60">Enter your financial details for personalized analysis</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <CardSpotlight className="lg:col-span-2 rounded-2xl border-white/10 bg-black/40 p-8" radius={420}>
            <div className="relative z-10">
              <h2 className="text-xl font-semibold mb-6">Your Financial Profile</h2>

              {/* Income Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/70 uppercase tracking-wide mb-4">
                  <DollarSign className="w-4 h-4" />
                  Income
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    label="Annual Salary"
                    value={input.annualSalary}
                    onChange={(v) => setInput({ ...input, annualSalary: v })}
                    description="Your salary + allowances"
                  />
                  <NumberField
                    label="Other Income"
                    value={input.otherIncome}
                    onChange={(v) => setInput({ ...input, otherIncome: v })}
                    description="Interest, rental, etc."
                  />
                </div>
              </div>

              {/* Deductions Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/70 uppercase tracking-wide mb-4">
                  <Briefcase className="w-4 h-4" />
                  Deductions
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    label="Section 80C"
                    value={input.deductions80C}
                    onChange={(v) => setInput({ ...input, deductions80C: v })}
                    description="Life insurance, ELSS, PPF"
                  />
                  <NumberField
                    label="NPS Contribution"
                    value={input.nps}
                    onChange={(v) => setInput({ ...input, nps: v })}
                    description="Section 80CCC + 80CCD"
                  />
                  <NumberField
                    label="Home Loan Interest"
                    value={input.homeLoanInterest}
                    onChange={(v) => setInput({ ...input, homeLoanInterest: v })}
                    description="Section 24 (max ₹2L)"
                  />
                  <NumberField
                    label="HRA Exemption"
                    value={input.hra}
                    onChange={(v) => setInput({ ...input, hra: v })}
                    description="Your monthly HRA amount"
                  />
                </div>
              </div>

              {/* Projection Settings */}
              <div className="mb-8 p-4 rounded-lg border border-white/10 bg-white/5">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/70 uppercase tracking-wide mb-4">
                  <TrendingUp className="w-4 h-4" />
                  Projections
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <NumberField
                    label="Years to Project"
                    value={projectionYears}
                    onChange={(v) => setProjectionYears(Math.max(1, Math.min(30, v)))}
                    description="1-30 years"
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
                    description="What-if scenarios"
                  />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <NoiseButton onClick={onAnalyze} disabled={loading}>
                {loading ? "Analyzing..." : "Analyze Now"}
              </NoiseButton>

              <div className="mt-4 text-xs text-white/50">
                AI analysis is enabled and will provide personalized insights.
              </div>
            </div>
          </CardSpotlight>

          {/* Info Panel */}
          <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-8" radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-6">
                <AlertCircle className="w-5 h-5" />
                Tips
              </h3>

              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                  <div className="text-sm font-medium mb-1">Be Accurate</div>
                  <p className="text-xs text-white/60">Use exact figures for better recommendations</p>
                </div>

                <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                  <div className="text-sm font-medium mb-1">Plan Ahead</div>
                  <p className="text-xs text-white/60">Project multiple years to see when regime switches benefit you</p>
                </div>

                <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                  <div className="text-sm font-medium mb-1">Ask Questions</div>
                  <p className="text-xs text-white/60">After analysis, use Q&A to clarify anything about the results</p>
                </div>

                <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                  <div className="text-sm font-medium mb-1">Review Audit Trail</div>
                  <p className="text-xs text-white/60">Check the exact deductions and slab breakdown for accuracy</p>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg border border-white/10 bg-sky-500/10">
                <p className="text-xs text-white/70">
                  <strong>Note:</strong> HRA is simplified for demo purposes. Verify calculations with official sources.
                </p>
              </div>
            </div>
          </CardSpotlight>
        </div>
      </div>
    </div>
  );
}
