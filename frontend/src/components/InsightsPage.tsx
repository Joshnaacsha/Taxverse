"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnalyzeResponse } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Cpu, AlertCircle, TrendingUp, Zap } from "lucide-react";

function Stat(props: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black flex items-center justify-center">
        <div className="text-white/60">Loading insights...</div>
      </div>
    );
  }

  if (!result || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black pt-8 pb-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">No Data Available</h1>
            <p className="text-white/60">Run the calculator to unlock detailed insights.</p>
          </div>
        </div>
      </div>
    );
  }

  const recommended = report.options.find((o) => o.id === report.recommendedOptionId)?.name ?? report.recommendedOptionId;
  const money = (value: number) => formatMoney(value, report.currency);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black pt-8 pb-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Detailed Insights</h1>
          <p className="text-white/60">{report.taxYear} • {report.country} • Recommended: {recommended}</p>
        </div>

        {result.aiAnalysis ? (
          <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-8 mb-8" radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-xl font-semibold mb-4">
                <Cpu className="w-5 h-5" />
                AI Analysis
              </h3>

              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                  <div className="text-sm font-semibold text-white/70 mb-2">Summary</div>
                  <p className="text-sm text-white/80">{result.aiAnalysis.summary}</p>
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
                  <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="text-sm font-semibold text-white/70 mb-3">Actionable Advice</div>
                    <ul className="space-y-2">
                      {result.aiAnalysis.actionableAdvice.map((advice, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-white/70">
                          <span className="text-green-400 mt-0.5">→</span>
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
          <Stat label="Options" value={`${report.options.length}`} icon={<Zap className="w-4 h-4 text-violet-400" />} />
          <Stat label="Stability" value={insights?.stability ?? "—"} icon={<AlertCircle className="w-4 h-4 text-amber-400" />} />
        </div>

        {scenarioData.length ? (
          <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-8 mb-8" radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <TrendingUp className="w-5 h-5" />
                Scenario Sensitivity
              </h3>
              <p className="text-sm text-white/60 mb-6">How savings and taxes change under what-if scenarios.</p>
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
          <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-8" radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <AlertCircle className="w-5 h-5" />
                Decision Stability
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                  <div className="inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold mb-2">
                    {insights.stability}
                  </div>
                  <p className="text-sm text-white/80 mt-2">{insights.stabilityReason}</p>
                </div>
                {insights.flipPoints.earnedIncomeFlip ? (
                  <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                      <div className="text-sm font-semibold text-white/70 mb-2">Flip point (approx)</div>
                      <p className="text-sm text-white/80">
                        Around {money(insights.flipPoints.earnedIncomeFlip.approxAnnualIncome)} annual income:
                        {" "}{insights.flipPoints.earnedIncomeFlip.recommendedBelow} → {insights.flipPoints.earnedIncomeFlip.recommendedAbove}
                      </p>
                    </div>
                ) : (
                  <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="text-sm font-semibold text-white/70 mb-2">Flip point</div>
                    <p className="text-sm text-white/70">No flip detected in the searched range.</p>
                  </div>
                )}
              </div>
            </div>
          </CardSpotlight>
        ) : null}
      </div>
    </div>
  );
}
