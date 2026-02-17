"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnalyzeResponse, SalaryResult } from "@/lib/types";
import { formatMoney, formatPct } from "@/lib/format";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Spotlight } from "@/components/ui/spotlight";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { cn } from "@/lib/utils";
import { uiTheme } from "@/lib/uiTheme";
import {
  TrendingUp,
  BarChart3,
  MessageCircle,
  DollarSign,
  FileText,
  Share2,
  Download,
  CalendarClock,
  AlertTriangle,
  Sparkles,
  BadgeCheck,
} from "lucide-react";
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

function CTAButton(props: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const sizeClass = props.size === "sm" ? "h-9 px-3 text-xs" : "h-11 px-4 text-sm";
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className={cn("inline-flex items-center justify-center rounded-xl", uiTheme.cta, sizeClass, props.className)}
    >
      {props.children}
    </button>
  );
}

function Stat(props: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className={`rounded-2xl p-5 ${uiTheme.panelSoft}`}>
      <div className={`mb-2 flex items-center gap-2 text-xs ${uiTheme.textMuted}`}>
        {props.icon}
        {props.label}
      </div>
      <div className="text-2xl font-bold text-white md:text-3xl">{props.value}</div>
    </div>
  );
}

function money(report: AnalyzeResponse["report"] | undefined, value: number): string {
  return formatMoney(value, report?.currency ?? "INR");
}

export function ResultsPage() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [salary, setSalary] = useState<SalaryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("taxResult");
      if (stored) setResult(JSON.parse(stored));
      const storedSalary = sessionStorage.getItem("salaryResult");
      if (storedSalary) setSalary(JSON.parse(storedSalary));
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

  const yearHighlights = useMemo(() => {
    if (!report || !projection.length) return [];
    return projection.slice(0, 3).map((p) => {
      const recName = optionNameById.get(p.recommendedOptionId) ?? p.recommendedOptionId;
      const recTax = p.optionTaxes?.[p.recommendedOptionId] ?? 0;
      return { year: p.year, recName, recTax: money(report, recTax) };
    });
  }, [optionNameById, projection, report]);

  const shareText = useMemo(() => {
    if (!report) return "";
    const rec = report.options.find((o) => o.id === report.recommendedOptionId);
    const saved = formatMoney(report.savings, report.currency);
    return `Taxverse: Recommended "${rec?.name ?? "option"}" for ${report.country} ${report.taxYear}. Saves ${saved}.`;
  }, [report]);

  const onCopyShare = async () => {
    if (!shareText) return;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const onExport = () => {
    if (typeof window !== "undefined") window.print();
  };

  const tdsPlan = salary?.tdsPlan;
  const tdsWarning = tdsPlan && tdsPlan.taxRemaining > Math.max(50_000, tdsPlan.annualTaxPayable * 0.35);
  const tdsTimeline = useMemo(() => {
    if (!tdsPlan || tdsPlan.monthsRemaining <= 0) return [];
    const now = new Date();
    return Array.from({ length: tdsPlan.monthsRemaining }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() + idx, 1);
      return new Intl.DateTimeFormat("en", { month: "short", year: "2-digit" }).format(d);
    });
  }, [tdsPlan]);

  if (loading) {
    return (
      <div className={`${uiTheme.page} flex items-center justify-center`}>
        <div className="text-white/72">Loading results...</div>
      </div>
    );
  }

  if (!result || !report) {
    return (
      <div className={`${uiTheme.page} pb-12 pt-10`}>
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h1 className="mb-4 text-3xl font-bold">No Results Found</h1>
            <p className={`${uiTheme.textMuted} mb-8`}>Run the calculator first to see results.</p>
            <CTAButton onClick={() => (window.location.href = "/salary")}>Analyze salary</CTAButton>
          </div>
        </div>
      </div>
    );
  }

  const comparisonData = report.options.map((o) => ({ name: o.name, tax: o.totalTax }));
  const projectionData = projection.map((p) => ({ year: p.year, ...p.optionTaxes }));

  const colors = ["#0ea5e9", "#a855f7", "#ec4899", "#f97316", "#14b8a6"];
  const optionColor = (index: number) => colors[index % colors.length];

  return (
    <div className={`${uiTheme.page} relative overflow-hidden pb-12 pt-10`}>
      <Spotlight className="-top-44 left-0" fill="rgba(14,165,233,0.28)" />
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10">
          <h1 className="mb-3 bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-400 bg-clip-text text-4xl font-bold text-transparent md:text-6xl">
            Results
          </h1>
          <p className="text-sm text-white/72 md:text-base">
            {report.taxYear} | {report.country} | Recommended: {recommendedOption?.name ?? report.recommendedOptionId}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <CTAButton onClick={onExport} size="sm">
              <span className="inline-flex items-center gap-2 text-xs md:text-sm">
                <Download className="h-4 w-4" /> Download / Print
              </span>
            </CTAButton>
            <CTAButton onClick={onCopyShare} size="sm">
              <span className="inline-flex items-center gap-2 text-xs md:text-sm">
                <Share2 className="h-4 w-4" /> {copied ? "Copied!" : "Copy summary"}
              </span>
            </CTAButton>
          </div>
        </div>

        <div className="mb-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Stat label="Gross income" value={money(report, report.grossIncome)} icon={<DollarSign className="h-4 w-4 text-cyan-400" />} />
          <Stat label="Recommended tax" value={money(report, recommendedOption?.totalTax ?? 0)} icon={<BarChart3 className="h-4 w-4 text-violet-400" />} />
          <Stat label="Effective rate" value={formatPct(recommendedOption?.effectiveRatePct ?? 0)} icon={<TrendingUp className="h-4 w-4 text-amber-400" />} />
          <Stat label="Estimated savings" value={money(report, report.savings)} icon={<TrendingUp className="h-4 w-4 text-green-400" />} />
        </div>

        <CardSpotlight className="mb-10 rounded-3xl border-white/20 bg-slate-900/70 p-8" radius={520}>
          <div className="relative z-10">
            <h2 className="mb-5 flex items-center gap-2 text-2xl font-semibold">
              <Sparkles className="h-6 w-6" />
              What This Means For You
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/20 bg-slate-800/70 p-4">
                <div className="mb-1 text-xs text-white/65">Best option now</div>
                <div className="text-lg font-semibold text-white">{recommendedOption?.name ?? "Recommended option"}</div>
                <div className="mt-2 text-sm text-white/72">Estimated tax: {money(report, recommendedOption?.totalTax ?? 0)}</div>
              </div>
              <div className="rounded-2xl border border-white/20 bg-slate-800/70 p-4">
                <div className="mb-1 text-xs text-white/65">Expected savings</div>
                <div className="text-lg font-semibold text-white">{money(report, report.savings)}</div>
                <div className="mt-2 text-sm text-white/72">Potential difference versus next best option.</div>
              </div>
              <div className="rounded-2xl border border-white/20 bg-slate-800/70 p-4">
                <div className="mb-1 text-xs text-white/65">What to do next</div>
                <div className="mt-1 text-sm text-white/86">Keep proofs ready, review TDS monthly, and revisit when income changes.</div>
              </div>
            </div>
          </div>
        </CardSpotlight>

        {salary?.breakdown ? (
          <CardSpotlight className="mb-10 rounded-3xl border-white/20 bg-slate-900/70 p-8" radius={520}>
            <div className="relative z-10">
              <h2 className="mb-2 text-2xl font-semibold">Salary Snapshot (India)</h2>
              <p className="mb-6 text-sm text-white/72">Based on your payslip/manual inputs.</p>
              <div className="mb-6 grid gap-4 md:grid-cols-3">
                <Stat label="Gross (Monthly)" value={formatMoney(salary.breakdown.grossMonthly, "INR")} icon={<DollarSign className="h-4 w-4 text-cyan-400" />} />
                <Stat label="Deductions (Monthly)" value={formatMoney(salary.breakdown.deductionsMonthly, "INR")} icon={<FileText className="h-4 w-4 text-violet-400" />} />
                <Stat label="In-hand (Before Tax)" value={formatMoney(salary.breakdown.inHandMonthlyBeforeTax, "INR")} icon={<TrendingUp className="h-4 w-4 text-green-400" />} />
              </div>

              {tdsPlan ? (
                <div className="space-y-3 rounded-2xl border border-white/20 bg-slate-800/70 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white/88">
                    <CalendarClock className="h-4 w-4" />
                    TDS Plan (estimated)
                    {tdsWarning ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-200">
                        <AlertTriangle className="h-3 w-3" /> High remaining
                      </span>
                    ) : null}
                  </div>
                  <div className="grid gap-3 text-sm md:grid-cols-5">
                    <div>
                      <div className="text-xs text-white/62">Annual tax</div>
                      <div className="font-semibold">{formatMoney(tdsPlan.annualTaxPayable, "INR")}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/62">Paid YTD</div>
                      <div className="font-semibold">{formatMoney(tdsPlan.taxPaidYtd, "INR")}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/62">Remaining</div>
                      <div className="font-semibold">{formatMoney(tdsPlan.taxRemaining, "INR")}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/62">Months left</div>
                      <div className="font-semibold">{tdsPlan.monthsRemaining}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/62">Suggested / month</div>
                      <div className="font-semibold">{formatMoney(tdsPlan.suggestedMonthlyTdsFromNow, "INR")}</div>
                    </div>
                  </div>
                  {tdsTimeline.length ? (
                    <div className="mt-2">
                      <div className="mb-1 text-xs text-white/62">Schedule</div>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {tdsTimeline.map((label) => (
                          <div key={label} className="min-w-[120px] flex-1 rounded-lg border border-white/20 bg-slate-900/70 px-3 py-2">
                            <div className="text-xs text-white/62">{label}</div>
                            <div className="text-sm font-semibold">{formatMoney(tdsPlan.suggestedMonthlyTdsFromNow, "INR")}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </CardSpotlight>
        ) : null}

        {result.executiveSummary?.headline ? (
          <CardSpotlight className="mb-10 rounded-3xl border-white/20 bg-slate-900/70 p-8" radius={520}>
            <div className="relative z-10">
              <h2 className="flex items-center gap-2 text-2xl font-semibold">
                <FileText className="h-6 w-6" />
                Executive Summary
              </h2>
              <div className="mt-3">
                <TextGenerateEffect words={result.executiveSummary.headline} duration={0.22} filter={false} />
              </div>
              {result.executiveSummary.bullets?.length ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/75 md:text-base">
                  {result.executiveSummary.bullets.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </CardSpotlight>
        ) : null}

        <div className="mb-10 grid gap-8 lg:grid-cols-2">
          <CardSpotlight className="rounded-3xl border-white/20 bg-slate-900/70 p-8" radius={520}>
            <div className="relative z-10">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <BarChart3 className="h-5 w-5" />
                Option Comparison
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" />
                  <YAxis stroke="rgba(255,255,255,0.3)" />
                  <Tooltip contentStyle={{ backgroundColor: "#0b1220", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} formatter={(value) => money(report, value as number)} />
                  <Legend />
                  <Bar dataKey="tax" name="Total tax" radius={[8, 8, 0, 0]} fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardSpotlight>

          <CardSpotlight className="rounded-3xl border-white/20 bg-slate-900/70 p-8" radius={520}>
            <div className="relative z-10">
              <h3 className="mb-2 flex items-center gap-2 text-xl font-semibold">
                <TrendingUp className="h-5 w-5" />
                Future Tax Trend
              </h3>
              <p className="mb-4 text-sm text-white/72">Projected tax by option.</p>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" stroke="rgba(255,255,255,0.3)" />
                  <YAxis stroke="rgba(255,255,255,0.3)" />
                  <Tooltip contentStyle={{ backgroundColor: "#0b1220", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} formatter={(value) => money(report, value as number)} />
                  <Legend />
                  {allOptionIds.map((id, idx) => (
                    <Line key={id} type="monotone" dataKey={id} stroke={colors[idx % colors.length]} strokeWidth={2.5} name={optionNameById.get(id) ?? id} dot={{ fill: colors[idx % colors.length], r: 3 }} activeDot={{ r: 5 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardSpotlight>
        </div>

        {yearHighlights.length ? (
          <CardSpotlight className="mb-10 rounded-3xl border-white/20 bg-slate-900/70 p-8" radius={520}>
            <div className="relative z-10">
              <h2 className="mb-5 text-2xl font-semibold">Next 3-Year Snapshot</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {yearHighlights.map((y) => (
                  <div key={y.year} className="rounded-2xl border border-white/20 bg-slate-800/70 p-4">
                    <div className="text-xs text-white/65">Year {y.year}</div>
                    <div className="mt-1 text-lg font-semibold text-white">{y.recName}</div>
                    <div className="mt-2 text-sm text-white/78">Estimated tax: {y.recTax}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardSpotlight>
        ) : null}

        {insights?.actionPlan?.length ? (
          <CardSpotlight className="mb-10 rounded-3xl border-white/20 bg-slate-900/70 p-8" radius={520}>
            <div className="relative z-10">
              <h2 className="mb-4 text-2xl font-semibold">Recommended Actions</h2>
              <p className="mb-6 text-sm text-white/72">Start from the top. These are ranked by expected impact.</p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {insights.actionPlan.slice(0, 6).map((action, idx) => (
                  <div key={idx} className="rounded-2xl border border-white/20 bg-slate-800/70 p-5">
                    <div className="mb-2 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 font-semibold text-white">
                        <BadgeCheck className="h-4 w-4 text-cyan-300" />
                        {action.label}
                      </div>
                      <div className="shrink-0 rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300">
                        {money(report, action.estimatedTaxSavedPer10k)}/10k
                      </div>
                    </div>
                    <div className="text-xs text-white/72">Add: {money(report, action.deltaUsed)} | Estimated save: {money(report, action.estimatedTaxSaved)}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardSpotlight>
        ) : null}

        <CardSpotlight className="mb-10 rounded-3xl border-white/20 bg-slate-900/70 p-8" radius={520}>
          <div className="relative z-10">
            <h2 className="mb-2 text-2xl font-semibold">Detailed Breakdown</h2>
            <p className="mb-5 text-sm text-white/72">Use this section only if you want full tax details by option.</p>
            <div className="space-y-4">
              {report.options.map((o) => (
                <details key={o.id} className="rounded-2xl border border-white/20 bg-slate-800/70 p-4">
                  <summary className="cursor-pointer select-none">
                    <span className="font-semibold text-white">{o.name}</span>
                    <span className="ml-3 text-sm text-white/78">| Total tax {money(report, o.totalTax)}</span>
                    {o.id === report.recommendedOptionId ? (
                      <span className="ml-3 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-300">Recommended</span>
                    ) : null}
                  </summary>
                  <div className="mt-5 grid gap-6 lg:grid-cols-2">
                    <div>
                      <div className="mb-2 text-sm font-semibold text-white/88">Deductions</div>
                      {o.deductionsBreakdown?.length ? (
                        <div className="overflow-auto rounded-xl border border-white/10">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-xs text-white/72">
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
                        <div className="text-sm text-white/72">No deductions breakdown for this option.</div>
                      )}
                    </div>
                    <div>
                      <div className="mb-2 text-sm font-semibold text-white/88">Slab breakdown</div>
                      {o.slabBreakdown?.length ? (
                        <div className="overflow-auto rounded-xl border border-white/10">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-xs text-white/72">
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
                        <div className="text-sm text-white/72">No slab breakdown available.</div>
                      )}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </CardSpotlight>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <CTAButton onClick={() => (window.location.href = "/qa")} className="w-full sm:w-auto">
            <span className="inline-flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> Ask Questions
            </span>
          </CTAButton>
          <CTAButton onClick={() => (window.location.href = "/insights")} className="w-full sm:w-auto">
            View Insights
          </CTAButton>
        </div>
      </div>
    </div>
  );
}
