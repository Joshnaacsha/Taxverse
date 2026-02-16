"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnalyzeResponse } from "@/lib/types";
import { formatMoney, formatPct } from "@/lib/format";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { NoiseBackground } from "@/components/ui/noise-background";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { cn } from "@/lib/utils";
import { TrendingUp, BarChart3, MessageCircle, DollarSign, FileText } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

function Stat(props: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
        {props.icon}
        {props.label}
      </div>
      <div className="text-2xl md:text-3xl font-bold text-white">{props.value}</div>
    </div>
  );
}

function money(report: AnalyzeResponse["report"] | undefined, value: number): string {
  return formatMoney(value, report?.currency ?? "INR");
}

export function ResultsPage() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("taxResult");
      if (stored) setResult(JSON.parse(stored));
      setLoading(false);
    }
  }, []);

  const report = result?.report;
  const insights = result?.insights;
  const projection = result?.projection ?? [];

  const recommendedOption = useMemo(() => {
    if (!report) return null;
    return report.options.find((o) => o.id === report.recommendedOptionId) ?? report.options[0] ?? null;
  }, [report]);

  const allOptionIds = useMemo(() => {
    const ids: string[] = [];
    const seen = new Set<string>();

    const add = (id: string) => {
      if (seen.has(id)) return;
      seen.add(id);
      ids.push(id);
    };

    for (const o of report?.options ?? []) add(o.id);
    for (const s of insights?.scenarios ?? []) {
      for (const o of s.report.options ?? []) add(o.id);
    }

    return ids;
  }, [insights?.scenarios, report?.options]);

  const optionNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of report?.options ?? []) map.set(o.id, o.name);
    for (const s of insights?.scenarios ?? []) {
      for (const o of s.report.options ?? []) {
        if (!map.has(o.id)) map.set(o.id, o.name);
      }
    }
    return map;
  }, [insights?.scenarios, report?.options]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black flex items-center justify-center">
        <div className="text-white/60">Loading results...</div>
      </div>
    );
  }

  if (!result || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black pt-10 pb-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">No Results Found</h1>
            <p className="text-white/60 mb-8">Please run the calculator first to see results.</p>
            <NoiseButton onClick={() => (window.location.href = "/calculator")}>Go to calculator</NoiseButton>
          </div>
        </div>
      </div>
    );
  }

  const comparisonData = report.options.map((o) => ({
    name: o.name,
    tax: o.totalTax,
  }));

  const projectionData = projection.map((p) => ({
    year: p.year,
    ...p.optionTaxes,
  }));

  const colors = ["#0ea5e9", "#a855f7", "#ec4899", "#f97316", "#14b8a6"];
  const optionColor = (index: number) => colors[index % colors.length];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black pt-10 pb-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-3">Results</h1>
          <p className="text-white/60 text-sm md:text-base">
            {report.taxYear} • {report.country} • Recommended: {recommendedOption?.name ?? report.recommendedOptionId}
          </p>
          {report.notes?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {report.notes.slice(0, 3).map((n, idx) => (
                <span key={idx} className="text-xs rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                  {n}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-10">
          <Stat label="Gross income" value={money(report, report.grossIncome)} icon={<DollarSign className="w-4 h-4 text-cyan-400" />} />
          <Stat label="Recommended tax" value={money(report, recommendedOption?.totalTax ?? 0)} icon={<BarChart3 className="w-4 h-4 text-violet-400" />} />
          <Stat label="Effective rate" value={formatPct(recommendedOption?.effectiveRatePct ?? 0)} icon={<TrendingUp className="w-4 h-4 text-amber-400" />} />
          <Stat label="Savings" value={money(report, report.savings)} icon={<TrendingUp className="w-4 h-4 text-green-400" />} />
        </div>

        {result.executiveSummary?.headline ? (
          <CardSpotlight className="rounded-3xl border-white/10 bg-black/40 p-8 mb-10" radius={520}>
            <div className="relative z-10">
              <h2 className="flex items-center gap-2 text-2xl font-semibold">
                <FileText className="w-6 h-6" />
                Executive Summary
              </h2>
              <div className="mt-3">
                <TextGenerateEffect words={result.executiveSummary.headline} duration={0.22} filter={false} />
              </div>
              {result.executiveSummary.bullets?.length ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm md:text-base text-white/75">
                  {result.executiveSummary.bullets.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </CardSpotlight>
        ) : null}

        <CardSpotlight className="rounded-3xl border-white/10 bg-black/40 p-8 mb-10" radius={520}>
          <div className="relative z-10">
            <h2 className="text-2xl font-semibold mb-5">Options (Table)</h2>
            <div className="overflow-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-xs text-white/60">
                  <tr>
                    <th className="px-4 py-3">Option</th>
                    <th className="px-4 py-3">Total tax</th>
                    <th className="px-4 py-3">Taxable income</th>
                    <th className="px-4 py-3">Deductions</th>
                    <th className="px-4 py-3">Effective rate</th>
                  </tr>
                </thead>
                <tbody>
                  {report.options.map((o) => {
                    const isRec = o.id === report.recommendedOptionId;
                    return (
                      <tr key={o.id} className="border-t border-white/10">
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">
                            {o.name}
                            {isRec ? (
                              <span className="ml-2 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-300">
                                Recommended
                              </span>
                            ) : null}
                          </div>
                          {o.notes?.length ? (
                            <div className="mt-1 text-xs text-white/50">{o.notes.slice(0, 2).join(" • ")}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 font-semibold">{money(report, o.totalTax)}</td>
                        <td className="px-4 py-3">{money(report, o.taxableIncome)}</td>
                        <td className="px-4 py-3">{money(report, o.totalDeductions)}</td>
                        <td className="px-4 py-3">{formatPct(o.effectiveRatePct)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardSpotlight>

        <div className="grid gap-8 lg:grid-cols-2 mb-10">
          <CardSpotlight className="rounded-3xl border-white/10 bg-black/40 p-8" radius={520}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                <BarChart3 className="w-5 h-5" />
                Option Comparison
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" />
                  <YAxis stroke="rgba(255,255,255,0.3)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0b1220", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    formatter={(value) => money(report, value as number)}
                  />
                  <Legend />
                  <Bar dataKey="tax" name="Total tax" radius={[8, 8, 0, 0]} fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardSpotlight>

          <CardSpotlight className="rounded-3xl border-white/10 bg-black/40 p-8" radius={520}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-xl font-semibold mb-2">
                <TrendingUp className="w-5 h-5" />
                Projection Chart
              </h3>
              <p className="text-sm text-white/60 mb-4">Projected tax by option.</p>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" stroke="rgba(255,255,255,0.3)" />
                  <YAxis stroke="rgba(255,255,255,0.3)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0b1220", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    formatter={(value) => money(report, value as number)}
                  />
                  <Legend />
                  {allOptionIds.map((id, idx) => (
                    <Line
                      key={id}
                      type="monotone"
                      dataKey={id}
                      stroke={optionColor(idx)}
                      strokeWidth={2.5}
                      name={optionNameById.get(id) ?? id}
                      dot={{ fill: optionColor(idx), r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardSpotlight>
        </div>

        {projection.length ? (
          <CardSpotlight className="rounded-3xl border-white/10 bg-black/40 p-8 mb-10" radius={520}>
            <div className="relative z-10">
              <h2 className="text-2xl font-semibold mb-5">Projection (Table)</h2>
              <div className="overflow-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-xs text-white/60">
                    <tr>
                      <th className="px-4 py-3">Year</th>
                      <th className="px-4 py-3">Annual income</th>
                      <th className="px-4 py-3">Gross income</th>
                      <th className="px-4 py-3">Recommended</th>
                      {allOptionIds.map((id) => (
                        <th key={id} className="px-4 py-3">{optionNameById.get(id) ?? id}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projection.map((p) => (
                      <tr key={p.year} className="border-t border-white/10">
                        <td className="px-4 py-3">{p.year}</td>
                        <td className="px-4 py-3">{money(report, p.annualIncome)}</td>
                        <td className="px-4 py-3">{money(report, p.grossIncome)}</td>
                        <td className="px-4 py-3">
                          {optionNameById.get(p.recommendedOptionId) ?? p.recommendedOptionId}
                        </td>
                        {allOptionIds.map((id) => (
                          <td key={id} className="px-4 py-3">{money(report, p.optionTaxes?.[id] ?? 0)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardSpotlight>
        ) : null}

        {insights?.scenarios?.length ? (
          <CardSpotlight className="rounded-3xl border-white/10 bg-black/40 p-8 mb-10" radius={520}>
            <div className="relative z-10">
              <h2 className="text-2xl font-semibold mb-5">Scenarios (Table)</h2>
              <div className="overflow-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-xs text-white/60">
                    <tr>
                      <th className="px-4 py-3">Scenario</th>
                      <th className="px-4 py-3">Recommended</th>
                      <th className="px-4 py-3">Savings</th>
                      {allOptionIds.map((id) => (
                        <th key={id} className="px-4 py-3">{optionNameById.get(id) ?? id}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {insights.scenarios.map((s) => {
                      const recName = optionNameById.get(s.report.recommendedOptionId) ?? s.report.recommendedOptionId;
                      const taxesById = new Map(s.report.options.map((o) => [o.id, o.totalTax] as const));
                      return (
                        <tr key={s.name} className="border-t border-white/10 align-top">
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">{s.name}</div>
                            <div className="text-xs text-white/50">{s.description}</div>
                          </td>
                          <td className="px-4 py-3">{recName}</td>
                          <td className="px-4 py-3">{money(report, s.report.savings)}</td>
                          {allOptionIds.map((id) => (
                            <td key={id} className="px-4 py-3">{money(report, taxesById.get(id) ?? 0)}</td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </CardSpotlight>
        ) : null}

        <CardSpotlight className="rounded-3xl border-white/10 bg-black/40 p-8 mb-10" radius={520}>
          <div className="relative z-10">
            <h2 className="text-2xl font-semibold mb-2">Audit Trail</h2>
            <p className="text-sm text-white/60 mb-5">Expand an option to see slabs and deductions.</p>

            <div className="space-y-4">
              {report.options.map((o) => (
                <details key={o.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <summary className="cursor-pointer select-none">
                    <span className="font-semibold text-white">{o.name}</span>
                    <span className="ml-3 text-sm text-white/70">• Total tax {money(report, o.totalTax)}</span>
                    {o.id === report.recommendedOptionId ? (
                      <span className="ml-3 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-300">Recommended</span>
                    ) : null}
                  </summary>

                  <div className="mt-5 grid gap-6 lg:grid-cols-2">
                    <div>
                      <div className="text-sm font-semibold text-white/80 mb-2">Deductions</div>
                      {o.deductionsBreakdown?.length ? (
                        <div className="overflow-auto rounded-xl border border-white/10">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-xs text-white/60">
                              <tr>
                                <th className="px-3 py-2">Label</th>
                                <th className="px-3 py-2">Allowed</th>
                              </tr>
                            </thead>
                            <tbody>
                              {o.deductionsBreakdown.map((d) => (
                                <tr key={d.label} className="border-t border-white/10">
                                  <td className="px-3 py-2">{d.label}</td>
                                  <td className="px-3 py-2">{money(report, d.allowed)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-sm text-white/60">No deductions breakdown for this option.</div>
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-white/80 mb-2">Slab breakdown</div>
                      {o.slabBreakdown?.length ? (
                        <div className="overflow-auto rounded-xl border border-white/10">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-xs text-white/60">
                              <tr>
                                <th className="px-3 py-2">From</th>
                                <th className="px-3 py-2">To</th>
                                <th className="px-3 py-2">Rate</th>
                                <th className="px-3 py-2">Tax</th>
                              </tr>
                            </thead>
                            <tbody>
                              {o.slabBreakdown.map((s, idx) => (
                                <tr key={idx} className="border-t border-white/10">
                                  <td className="px-3 py-2">{money(report, s.from)}</td>
                                  <td className="px-3 py-2">{money(report, s.to)}</td>
                                  <td className="px-3 py-2">{(s.rate * 100).toFixed(0)}%</td>
                                  <td className="px-3 py-2">{money(report, s.tax)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-sm text-white/60">No slab breakdown available.</div>
                      )}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </CardSpotlight>

        {insights?.actionPlan?.length ? (
          <CardSpotlight className="rounded-3xl border-white/10 bg-black/40 p-8 mb-10" radius={520}>
            <div className="relative z-10">
              <h2 className="text-2xl font-semibold mb-4">Recommended Actions</h2>
              <p className="text-sm text-white/60 mb-6">Deterministic suggestions ranked by impact.</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.actionPlan.slice(0, 6).map((action, idx) => (
                  <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="font-semibold text-white">{action.label}</div>
                      <div className="shrink-0 text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded">
                        {money(report, action.estimatedTaxSavedPer10k)}/10k
                      </div>
                    </div>
                    <div className="text-xs text-white/60">
                      Δ used: {money(report, action.deltaUsed)} • Est. saved: {money(report, action.estimatedTaxSaved)}
                    </div>
                    {action.notes?.length ? (
                      <div className="mt-2 text-xs text-white/50">{action.notes.slice(0, 1).join(" ")}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </CardSpotlight>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <NoiseButton onClick={() => (window.location.href = "/qa")} className="w-full sm:w-auto">
            <span className="inline-flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> Ask Questions
            </span>
          </NoiseButton>
          <NoiseButton onClick={() => (window.location.href = "/insights")} className="w-full sm:w-auto">
            View Insights
          </NoiseButton>
        </div>
      </div>
    </div>
  );
}
