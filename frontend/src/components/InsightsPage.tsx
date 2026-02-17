"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnalyzeResponse } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Spotlight } from "@/components/ui/spotlight";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Cpu, AlertCircle, TrendingUp, Zap, Compass, Clock, Sparkles, BadgeCheck } from "lucide-react";
import { uiTheme } from "@/lib/uiTheme";

function Stat(props: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className={`rounded-xl p-4 ${uiTheme.panelSoft}`}>
      <div className={`flex items-center gap-2 text-xs ${uiTheme.textMuted} mb-2`}>
        {props.icon}
        {props.label}
      </div>
      <div className="text-2xl font-bold text-white">{props.value}</div>
    </div>
  );
}

export function InsightsPage() {
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

  const scenarioData = useMemo(() => {
    return (
      insights?.scenarios?.map((s) => {
        const best = [...s.report.options].sort((a, b) => a.totalTax - b.totalTax)[0];
        return {
          name: s.name,
          bestTax: best?.totalTax ?? 0,
          savings: s.report.savings,
        };
      }) ?? []
    );
  }, [insights]);

  const nextActions = useMemo(() => {
    if (!insights) return [];
    const actions = insights.actionPlan ?? [];
    return actions
      .slice(0, 5)
      .map((a, idx) => ({
        id: `${a.label}-${idx}`,
        label: a.label,
        saved: a.estimatedTaxSaved,
        savedPer10k: a.estimatedTaxSavedPer10k,
        notes: a.notes?.[0],
      }));
  }, [insights]);

  const flipPoint = insights?.flipPoints?.earnedIncomeFlip;
  const reportCurrency = report?.currency ?? "INR";
  const money = (value: number) => formatMoney(value, reportCurrency);
  const futureTips = useMemo(() => {
    if (!report) return [];
    const tips: string[] = [];
    if (nextActions[0]?.label) {
      tips.push(`Start with ${nextActions[0].label}. It gives the strongest tax impact in your current profile.`);
    }
    if (flipPoint) {
      tips.push(`If your annual income goes near ${money(flipPoint.approxAnnualIncome)}, recheck your regime because your best option may change.`);
    }
    if (report.savings > 0) {
      tips.push(`You are already saving ${money(report.savings)} with the current recommendation. Keep your documents ready so you can claim the full benefit.`);
    }
    return tips.slice(0, 3);
  }, [flipPoint, nextActions, report, reportCurrency]);

  if (loading) {
    return (
      <div className={`${uiTheme.page} flex items-center justify-center`}>
        <div className={uiTheme.textMuted}>Loading insights...</div>
      </div>
    );
  }

  if (!result || !report) {
    return (
      <div className={`${uiTheme.page} pt-8 pb-12`}>
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">No Data Available</h1>
            <p className="text-white/72">Run the calculator to unlock detailed insights.</p>
          </div>
        </div>
      </div>
    );
  }

  const recommended = report.options.find((o) => o.id === report.recommendedOptionId)?.name ?? report.recommendedOptionId;
  const isIndia = report.country === "IN";

  return (
    <div className={`${uiTheme.page} relative overflow-hidden pt-8 pb-12`}>
      <Spotlight className="-top-52 left-0" fill="rgba(56,189,248,0.32)" />
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h1 className="mb-2 bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-400 bg-clip-text text-4xl font-bold text-transparent">
            Insights You Can Use
          </h1>
          <p className="text-white/72">{report.taxYear} | {report.country} | Recommended: {recommended}</p>
        </div>

        {result.aiAnalysis ? (
          <CardSpotlight className={`rounded-2xl p-8 mb-8 ${uiTheme.panel}`} radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                <Cpu className="w-5 h-5" />
                AI Analysis
              </h3>

              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-white/20 bg-slate-800/70">
                  <div className="text-sm font-semibold text-white/78 mb-2">Summary</div>
                  <p className="text-sm text-white/88">{result.aiAnalysis.summary}</p>
                </div>

                {result.aiAnalysis.futureWarning ? (
                  <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/10">
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-300 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      Future Considerations
                    </div>
                    <p className="text-sm text-amber-100">{result.aiAnalysis.futureWarning}</p>
                  </div>
                ) : null}

                {result.aiAnalysis.actionableAdvice?.length ? (
                  <div className="p-4 rounded-lg border border-white/20 bg-slate-800/70">
                    <div className="text-sm font-semibold text-white/78 mb-3">Actionable Advice</div>
                    <ul className="space-y-2">
                      {result.aiAnalysis.actionableAdvice.map((advice, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-white/78">
                          <span className="text-green-400 mt-0.5">-</span>
                          <span>{advice}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </CardSpotlight>
        ) : null}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat label="Gross Income" value={money(report.grossIncome)} icon={<TrendingUp className="w-4 h-4 text-cyan-400" />} />
          <Stat label="Savings" value={money(report.savings)} icon={<TrendingUp className="w-4 h-4 text-green-400" />} />
          <Stat label="Options" value={`${report.options.length}`} icon={<Zap className="w-4 h-4 text-sky-400" />} />
          <Stat label="Stability" value={insights?.stability ?? "-"} icon={<AlertCircle className="w-4 h-4 text-amber-400" />} />
        </div>

        {scenarioData.length ? (
          <CardSpotlight className={`rounded-2xl p-8 mb-8 ${uiTheme.panel}`} radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <TrendingUp className="w-5 h-5" />
                If Your Situation Changes
              </h3>
              <p className="text-sm text-white/72 mb-6">Simple what-if view of how your tax may change.</p>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={scenarioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" />
                  <YAxis stroke="rgba(255,255,255,0.3)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    formatter={(value) => money(value as number)}
                  />
                  <Legend />
                  <Bar dataKey="bestTax" name="Best option tax" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="savings" name="Savings" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardSpotlight>
        ) : null}

        {insights ? (
          <CardSpotlight className={`rounded-2xl p-8 ${uiTheme.panel}`} radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <AlertCircle className="w-5 h-5" />
                Is This Recommendation Stable?
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg border border-white/20 bg-slate-800/70">
                  <div className="inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold mb-2">
                    {insights.stability}
                  </div>
                  <p className="text-sm text-white/88 mt-2">{insights.stabilityReason}</p>
                </div>
                {insights.flipPoints.earnedIncomeFlip ? (
                  <div className="p-4 rounded-lg border border-white/20 bg-slate-800/70">
                    <div className="text-sm font-semibold text-white/78 mb-2">Flip point (approx)</div>
                    <p className="text-sm text-white/88">
                      Around {money(insights.flipPoints.earnedIncomeFlip.approxAnnualIncome)} annual income:
                      {" "}{insights.flipPoints.earnedIncomeFlip.recommendedBelow} to {insights.flipPoints.earnedIncomeFlip.recommendedAbove}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-white/20 bg-slate-800/70">
                    <div className="text-sm font-semibold text-white/78 mb-2">Flip point</div>
                    <p className="text-sm text-white/78">No flip detected in the searched range.</p>
                  </div>
                )}
              </div>
            </div>
          </CardSpotlight>
        ) : null}

        <CardSpotlight className={`rounded-2xl p-8 mt-8 ${uiTheme.panel}`} radius={420}>
          <div className="relative z-10">
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Compass className="w-5 h-5" />
              What You Can Do Next
            </h3>
            {nextActions.length ? (
              <div className="grid md:grid-cols-2 gap-4">
                {nextActions.map((action) => (
                  <div key={action.id} className="rounded-xl border border-white/20 bg-slate-800/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white/88">{action.label}</div>
                        {action.notes ? <div className="text-xs text-white/62 mt-1">{action.notes}</div> : null}
                      </div>
                      <div className="text-xs bg-cyan-500/20 text-cyan-200 px-2 py-1 rounded">
                        {money(action.savedPer10k ?? action.saved ?? 0)} /10k
                      </div>
                    </div>
                    <div className="text-xs text-white/62 mt-2">
                      Est. saved: {money(action.saved ?? 0)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-white/72">Run the calculator to populate a prioritized plan.</div>
            )}

            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100 flex items-start gap-3">
              <Clock className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-200 mb-1">Flip point watch</div>
                {flipPoint ? (
                  <div>
                    Around {money(flipPoint.approxAnnualIncome)} income, recommendation flips
                    {flipPoint.recommendedBelow && flipPoint.recommendedAbove
                      ? ` from ${flipPoint.recommendedBelow} to ${flipPoint.recommendedAbove}`
                      : ""}. Keep an eye on increments/bonuses.
                  </div>
                ) : (
                  <div>No flip detected in the searched range. Safe to stay with the current regime for now.</div>
                )}
              </div>
            </div>

            {futureTips.length ? (
              <div className="mt-6 rounded-xl border border-sky-300/25 bg-sky-500/10 p-4 text-sm text-sky-100">
                <div className="mb-3 flex items-center gap-2 font-semibold text-sky-200">
                  <Sparkles className="h-4 w-4" />
                  Future Savings Plan
                </div>
                <ul className="space-y-3">
                  {futureTips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {isIndia ? (
              <div className="mt-6 rounded-xl border border-white/20 bg-slate-800/70 p-4 text-sm text-white/88 space-y-2">
                <div className="font-semibold text-white">India quick saves</div>
                <div>80C: up to Rs 1.5L across EPF, PPF, ELSS, term-life and tuition; keep proofs ready.</div>
                <div>NPS 80CCD(1B): extra Rs 50k over 80C; useful if you can lock this amount for long term.</div>
                <div>Home loan 24B: up to Rs 2L interest in many cases; keep lender interest certificate.</div>
                <div>HRA: keep rent receipts and landlord PAN (above Rs 1L yearly); claim as per rules.</div>
              </div>
            ) : null}
          </div>
        </CardSpotlight>
      </div>
    </div>
  );
}



