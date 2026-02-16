"use client";

import { useMemo, useState } from "react";
import type { AnalyzeResponse, IndiaTaxInput, QaMessage } from "@/lib/types";
import { analyzeTax, askQuestion } from "@/lib/api";
import { formatInr, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";

import { AuroraBackground } from "@/components/ui/aurora-background";
import { NoiseBackground } from "@/components/ui/noise-background";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe } from "@/components/magicui/globe";

const defaultInput: IndiaTaxInput = {
  annualSalary: 60000 * 12,
  otherIncome: 1_200_000,
  deductions80C: 150_000,
  nps: 50_000,
  homeLoanInterest: 200_000,
  hra: 100_000,
};

export function TaxDashboard() {
  const [input, setInput] = useState<IndiaTaxInput>(defaultInput);
  const [projectionYears, setProjectionYears] = useState(5);
  const [projectionGrowthRatePct, setProjectionGrowthRatePct] = useState(10);
  const [scenarioCount, setScenarioCount] = useState(8);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<QaMessage[]>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);

  const summary = result?.comparisonResult;
  const insights = result?.insights;

  const recommended = summary?.recommended;
  const savings = summary?.savings ?? 0;

  const onAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await analyzeTax({
        input,
        options: {
          includeAi: true,
          projectionYears,
          projectionGrowthRatePct,
          scenarioCount,
        },
      });
      setResult(r);
      setMessages([]);
      setFollowUps([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const contextForQa = useMemo(() => {
    if (!result) return null;
    return {
      executiveSummary: result.executiveSummary,
      comparisonResult: result.comparisonResult,
      projection: result.projection,
      insights: result.insights,
      aiAnalysis: result.aiAnalysis,
    };
  }, [result]);

  const onAsk = async (q?: string) => {
    const text = (q ?? question).trim();
    if (!text) return;
    if (!contextForQa) {
      setQaError("Run Analyze first to generate context.");
      return;
    }

    setQaLoading(true);
    setQaError(null);

    const nextMessages: QaMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setQuestion("");

    try {
      const r = await askQuestion({
        context: contextForQa,
        question: text,
        history: nextMessages,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: r.answer }]);
      setFollowUps(r.followUps ?? []);
    } catch (e) {
      setQaError(e instanceof Error ? e.message : "Unknown Q&A error");
    } finally {
      setQaLoading(false);
    }
  };

  const headerLine = useMemo(() => {
    if (!summary) return "Run analysis to see results.";
    return `${summary.financialYear} • Recommended: ${recommended} • Savings: ${formatInr(savings)}`;
  }, [recommended, savings, summary]);

  const scrollToAnalyze = () => {
    const el = document.getElementById("analyze");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <AuroraBackground className="h-[85vh] justify-start bg-zinc-950 text-white dark:bg-zinc-950 dark:text-white">
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                Tax regime decision engine
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                RegimeIQ{" "}
                <span className="bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Hackathon
                </span>
              </h1>
              <p className="mt-3 max-w-xl text-sm text-white/75">
                Enter your numbers, get a clear recommendation, projected outcomes, and an AI explanation you can question.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <NoiseButton onClick={scrollToAnalyze}>Start analysis</NoiseButton>
                <div className="text-xs text-white/55">AI analysis is always enabled.</div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <div className="aspect-square w-full overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                <Globe className="h-full w-full" />
              </div>
              <div className="mt-3 text-center text-xs text-white/50">Drag to rotate</div>
            </div>
          </div>
        </div>
      </AuroraBackground>

      <div id="analyze" className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-5">
          <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-6 lg:col-span-2" radius={420}>
            <div className="relative z-10 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Inputs</h2>
              <NoiseButton onClick={onAnalyze} disabled={loading}>
                {loading ? "Analyzing..." : "Analyze"}
              </NoiseButton>
            </div>

            <div className="relative z-10 mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberField label="Annual Salary (₹)" value={input.annualSalary} onChange={(v) => setInput({ ...input, annualSalary: v })} />
                <NumberField label="Other Income (₹)" value={input.otherIncome} onChange={(v) => setInput({ ...input, otherIncome: v })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberField label="80C (₹)" value={input.deductions80C} onChange={(v) => setInput({ ...input, deductions80C: v })} />
                <NumberField label="NPS (₹)" value={input.nps} onChange={(v) => setInput({ ...input, nps: v })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberField label="Home Loan Int. (₹)" value={input.homeLoanInterest} onChange={(v) => setInput({ ...input, homeLoanInterest: v })} />
                <NumberField label="HRA (₹)" value={input.hra} onChange={(v) => setInput({ ...input, hra: v })} />
              </div>

              <div className="mt-1 grid gap-3 sm:grid-cols-2">
                <NumberField label="Projection years" value={projectionYears} onChange={(v) => setProjectionYears(Math.max(1, Math.min(30, v)))} />
                <NumberField label="Growth % / year" value={projectionGrowthRatePct} onChange={(v) => setProjectionGrowthRatePct(v)} />
              </div>
              <NumberField label="Scenario count" value={scenarioCount} onChange={(v) => setScenarioCount(Math.max(1, Math.min(20, v)))} />

              {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
              <div className="text-xs text-white/50">Note: HRA is simplified for demo.</div>
            </div>
          </CardSpotlight>

          <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-6 lg:col-span-3" radius={420}>
            <div className="relative z-10">
              <h2 className="text-lg font-semibold">Executive Summary</h2>
              <p className="mt-1 text-sm text-white/70">{headerLine}</p>

              {result?.executiveSummary?.headline ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm text-white/80">Summary</div>
                  <TextGenerateEffect words={result.executiveSummary.headline} duration={0.25} filter={false} />
                  {result.executiveSummary.bullets?.length ? (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/70">
                      {result.executiveSummary.bullets.map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/5 p-5 text-sm text-white/70">
                  Run Analyze to generate a summary and unlock the tabs below.
                </div>
              )}

              {summary ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Stat label="Gross income" value={formatInr(summary.grossIncome)} />
                  <Stat label="Savings" value={formatInr(summary.savings)} />
                  <Stat label="Recommended" value={summary.recommended} />
                  <Stat label="Old tax" value={formatInr(summary.oldRegime.totalTax)} />
                  <Stat label="New tax" value={formatInr(summary.newRegime.totalTax)} />
                  <Stat label="Eff. rate (old/new)" value={`${formatPct(summary.oldRegime.effectiveRatePct)} / ${formatPct(summary.newRegime.effectiveRatePct)}`} />
                </div>
              ) : null}

              {insights ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold">Stability: {insights.stability}</div>
                  <div className="mt-1 text-sm text-white/70">{insights.stabilityReason}</div>
                </div>
              ) : null}
            </div>
          </CardSpotlight>
        </div>

        {result ? (
          <div className="mt-8">
            <Tabs defaultValue="plan">
              <TabsList className="grid w-full grid-cols-3 gap-2 bg-white/5 p-2 lg:grid-cols-6">
                <TabsTrigger value="plan">Plan</TabsTrigger>
                <TabsTrigger value="projection">Projection</TabsTrigger>
                <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
                <TabsTrigger value="ai">AI</TabsTrigger>
                <TabsTrigger value="qa">Q&A</TabsTrigger>
                <TabsTrigger value="audit">Audit</TabsTrigger>
              </TabsList>

              <TabsContent value="plan" className="mt-4">
                <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-6" radius={420}>
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold">Action Plan</h3>
                    <p className="mt-1 text-sm text-white/70">Best next move (estimated tax saved per next ₹10k).</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {(insights?.actionPlan ?? []).slice(0, 6).map((a) => (
                        <div key={a.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold">{a.label}</div>
                            <div className="text-xs text-white/70">{formatInr(a.estimatedTaxSavedPer10k)} / 10k</div>
                          </div>
                          <div className="mt-2 text-xs text-white/60">
                            Remaining cap: {formatInr(a.remaining)} • Δ used: {formatInr(a.deltaUsed)}
                          </div>
                        </div>
                      ))}
                      {!insights?.actionPlan?.length ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                          No capped deductions remaining (80C/NPS/home-loan).
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardSpotlight>
              </TabsContent>

              <TabsContent value="projection" className="mt-4">
                <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-6" radius={420}>
                  <div className="relative z-10 overflow-auto">
                    <h3 className="text-lg font-semibold">Projection</h3>
                    <p className="mt-1 text-sm text-white/70">How recommendation changes as salary grows.</p>
                    <div className="mt-4 overflow-auto rounded-xl border border-white/10">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-xs text-white/60">
                          <tr>
                            <th className="px-3 py-2">Year</th>
                            <th className="px-3 py-2">Salary</th>
                            <th className="px-3 py-2">Rec</th>
                            <th className="px-3 py-2">Old</th>
                            <th className="px-3 py-2">New</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(result.projection ?? []).map((p) => (
                            <tr key={p.year} className="border-t border-white/10">
                              <td className="px-3 py-2">{p.year}</td>
                              <td className="px-3 py-2">{formatInr(p.annualSalary)}</td>
                              <td className="px-3 py-2">{p.recommended}</td>
                              <td className="px-3 py-2">{formatInr(p.oldTax)}</td>
                              <td className="px-3 py-2">{formatInr(p.newTax)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardSpotlight>
              </TabsContent>

              <TabsContent value="scenarios" className="mt-4">
                <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-6" radius={420}>
                  <div className="relative z-10 overflow-auto">
                    <h3 className="text-lg font-semibold">Scenarios</h3>
                    <p className="mt-1 text-sm text-white/70">Auto-generated what-if runs.</p>
                    <div className="mt-4 overflow-auto rounded-xl border border-white/10">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-xs text-white/60">
                          <tr>
                            <th className="px-3 py-2">Scenario</th>
                            <th className="px-3 py-2">Rec</th>
                            <th className="px-3 py-2">Old</th>
                            <th className="px-3 py-2">New</th>
                            <th className="px-3 py-2">Savings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(insights?.scenarios ?? []).map((s) => (
                            <tr key={s.name} className="border-t border-white/10 align-top">
                              <td className="px-3 py-2">
                                <div className="font-medium text-white">{s.name}</div>
                                <div className="text-xs text-white/60">{s.description}</div>
                              </td>
                              <td className="px-3 py-2">{s.comparison.recommended}</td>
                              <td className="px-3 py-2">{formatInr(s.comparison.oldRegime.totalTax)}</td>
                              <td className="px-3 py-2">{formatInr(s.comparison.newRegime.totalTax)}</td>
                              <td className="px-3 py-2">{formatInr(s.comparison.savings)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardSpotlight>
              </TabsContent>

              <TabsContent value="ai" className="mt-4">
                <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-6" radius={420}>
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold">AI Explanation</h3>
                    <p className="mt-1 text-sm text-white/70">Generated from your computed results (no recalculation).</p>
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm text-white/80">Summary</div>
                      <div className="mt-2 text-sm text-white">{result.aiAnalysis?.summary ?? "No AI summary returned."}</div>
                      {result.aiAnalysis?.futureWarning ? (
                        <div className="mt-3 text-sm text-white/70">{result.aiAnalysis.futureWarning}</div>
                      ) : null}
                      {result.aiAnalysis?.actionableAdvice?.length ? (
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/70">
                          {result.aiAnalysis.actionableAdvice.map((a, idx) => (
                            <li key={idx}>{a}</li>
                          ))}
                        </ul>
                      ) : null}
                      <div className="mt-3 text-xs text-white/55">
                        If AI is disabled, set GOOGLE_API_KEY in RegimeIQ/backend/.env.
                      </div>
                    </div>
                  </div>
                </CardSpotlight>
              </TabsContent>

              <TabsContent value="qa" className="mt-4">
                <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-6" radius={420}>
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold">Ask Questions</h3>
                    <p className="mt-1 text-sm text-white/70">Answers are grounded in your result context.</p>

                    <div className="mt-4 h-72 overflow-auto rounded-xl border border-white/10 bg-white/5 p-3">
                      {messages.length ? (
                        <div className="flex flex-col gap-3">
                          {messages.map((m, idx) => (
                            <div
                              key={idx}
                              className={
                                m.role === "user"
                                  ? "ml-auto max-w-[85%] rounded-2xl bg-white px-3 py-2 text-sm text-black"
                                  : "mr-auto max-w-[85%] rounded-2xl bg-black/60 px-3 py-2 text-sm text-white/80 ring-1 ring-white/10"
                              }
                            >
                              {m.content}
                            </div>
                          ))}
                          {qaLoading ? (
                            <div className="mr-auto max-w-[85%] rounded-2xl bg-black/60 px-3 py-2 text-sm text-white/60 ring-1 ring-white/10">
                              Thinking...
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="text-sm text-white/60">
                          Try: “Why is {summary?.recommended} better?” or “What’s the next best ₹10k allocation?”
                        </div>
                      )}
                    </div>

                    {followUps.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {followUps.map((f) => (
                          <NoiseButton key={f} onClick={() => onAsk(f)} disabled={qaLoading} size="sm">
                            {f}
                          </NoiseButton>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask a question…"
                        className="h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/20"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onAsk();
                        }}
                      />
                      <NoiseButton onClick={() => onAsk()} disabled={qaLoading}>
                        Ask
                      </NoiseButton>
                    </div>

                    {qaError ? <p className="mt-3 text-sm text-red-300">{qaError}</p> : null}
                  </div>
                </CardSpotlight>
              </TabsContent>

              <TabsContent value="audit" className="mt-4">
                <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-6" radius={420}>
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold">Audit Trail</h3>
                    <p className="mt-1 text-sm text-white/70">Exact deductions and slab breakdown.</p>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-sm font-semibold">Old Regime deductions</div>
                        <ul className="mt-3 space-y-1 text-sm text-white/75">
                          {(summary?.oldRegime.deductionsBreakdown ?? []).map((d) => (
                            <li key={d.label} className="flex items-center justify-between gap-4">
                              <span className="truncate">{d.label}</span>
                              <span className="shrink-0 text-white/70">{formatInr(d.allowed)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-sm font-semibold">New Regime deductions</div>
                        <ul className="mt-3 space-y-1 text-sm text-white/75">
                          {(summary?.newRegime.deductionsBreakdown ?? []).map((d) => (
                            <li key={d.label} className="flex items-center justify-between gap-4">
                              <span className="truncate">{d.label}</span>
                              <span className="shrink-0 text-white/70">{formatInr(d.allowed)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardSpotlight>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </div>

      <div className="pb-10 text-center text-xs text-white/40">Built for demo • HRA simplified • Verify with real rules</div>
    </div>
  );
}

function NumberField(props: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-white/70">{props.label}</span>
      <input
        type="number"
        value={Number.isFinite(props.value) ? props.value : 0}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-white/20"
      />
    </label>
  );
}

function Stat(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/60">{props.label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{props.value}</div>
    </div>
  );
}

function NoiseButton(props: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const sizeClass = props.size === "sm" ? "h-9 px-3 text-xs" : "h-11 px-4 text-sm";

  return (
    <NoiseBackground
      containerClassName={cn(
        "inline-block rounded-xl p-1",
        props.disabled && "opacity-50 pointer-events-none",
        props.className,
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
        className={cn(
          "w-full rounded-[0.7rem] bg-black/80 font-semibold text-white ring-1 ring-white/10 hover:bg-black/60",
          "transition-colors",
          sizeClass,
        )}
      >
        {props.children}
      </button>
    </NoiseBackground>
  );
}
