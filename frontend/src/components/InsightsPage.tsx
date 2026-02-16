"use client";

import { useEffect, useState } from "react";
import type { AnalyzeResponse } from "@/lib/types";
import { formatInr } from "@/lib/format";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Cpu, BarChart3, AlertCircle, TrendingUp, Zap } from "lucide-react";

function Stat(props: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
        {props.icon}
        {props.label}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold text-white">{props.value}</div>
      </div>
    </div>
  );
}

export function InsightsPage() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("taxResult");
      if (stored) {
        setResult(JSON.parse(stored));
      }
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black flex items-center justify-center">
        <div className="text-white/60">Loading insights...</div>
      </div>
    );
  }

  if (!result) {
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

  const summary = result.comparisonResult;
  const insights = result.insights;
  const scenarioData = insights?.scenarios?.map((s) => ({
    name: s.name,
    savings: s.comparison.savings,
    oldTax: s.comparison.oldRegime.totalTax,
    newTax: s.comparison.newRegime.totalTax,
  })) || [];

  const COLORS = ["#0ea5e9", "#a855f7", "#ec4899", "#f97316", "#14b8a6", "#eab308"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black pt-8 pb-12">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Detailed Insights</h1>
          <p className="text-white/60">Deep analysis of your tax optimization opportunities</p>
        </div>

        {/* AI Analysis */}
        {result.aiAnalysis && (
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

                {result.aiAnalysis.futureWarning && (
                  <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/10">
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-300 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      Future Considerations
                    </div>
                    <p className="text-sm text-amber-100">{result.aiAnalysis.futureWarning}</p>
                  </div>
                )}

                {result.aiAnalysis.actionableAdvice && result.aiAnalysis.actionableAdvice.length > 0 && (
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
                )}
              </div>
            </div>
          </CardSpotlight>
        )}

        {/* Scenario Comparison */}
        {scenarioData.length > 0 && (
          <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-8 mb-8" radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-xl font-semibold mb-6">
                <BarChart3 className="w-5 h-5" />
                Scenario Analysis
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={scenarioData}>
                  <defs>
                    <linearGradient id="colorOldTax" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorNewTax" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="rgba(255,255,255,0.3)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    formatter={(value) => formatInr(value as number)}
                  />
                  <Legend />
                  <Bar dataKey="oldTax" fill="url(#colorOldTax)" name="Old Regime Tax" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="newTax" fill="url(#colorNewTax)" name="New Regime Tax" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="savings" fill="url(#colorSavings)" name="Savings" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardSpotlight>
        )}

        {/* Deduction Breakdown */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Old Regime Deductions */}
          <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-8" radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <AlertCircle className="w-5 h-5" />
                Old Regime Deductions
              </h3>
              <div className="space-y-2">
                {(summary?.oldRegime.deductionsBreakdown || []).map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
                    <div className="text-sm text-white/80">{d.label}</div>
                    <div className="text-sm font-semibold text-cyan-400">{formatInr(d.allowed)}</div>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 rounded-lg border border-white/20 bg-white/10 mt-4">
                  <div className="text-sm font-semibold text-white">Total Tax</div>
                  <div className="text-lg font-bold text-white">{formatInr(summary?.oldRegime.totalTax || 0)}</div>
                </div>
              </div>
            </div>
          </CardSpotlight>

          {/* New Regime Deductions */}
          <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-8" radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <TrendingUp className="w-5 h-5" />
                New Regime Deductions
              </h3>
              <div className="space-y-2">
                {(summary?.newRegime.deductionsBreakdown || []).map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
                    <div className="text-sm text-white/80">{d.label}</div>
                    <div className="text-sm font-semibold text-violet-400">{formatInr(d.allowed)}</div>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 rounded-lg border border-white/20 bg-white/10 mt-4">
                  <div className="text-sm font-semibold text-white">Total Tax</div>
                  <div className="text-lg font-bold text-white">{formatInr(summary?.newRegime.totalTax || 0)}</div>
                </div>
              </div>
            </div>
          </CardSpotlight>
        </div>

        {/* Tax Optimization Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat
            label="Annual Savings"
            value={formatInr(summary?.savings || 0)}
            icon={<TrendingUp className="w-4 h-4 text-green-400" />}
          />
          <Stat
            label="Gross Income"
            value={formatInr(summary?.grossIncome || 0)}
            icon={<BarChart3 className="w-4 h-4 text-cyan-400" />}
          />
          <Stat
            label="Old Regime Effective Rate"
            value={`${((summary?.oldRegime.effectiveRatePct || 0) * 100).toFixed(2)}%`}
            icon={<TrendingUp className="w-4 h-4 text-amber-400" />}
          />
          <Stat
            label="New Regime Effective Rate"
            value={`${((summary?.newRegime.effectiveRatePct || 0) * 100).toFixed(2)}%`}
            icon={<TrendingUp className="w-4 h-4 text-violet-400" />}
          />
        </div>

        {/* Investment Recommendations */}
        {insights?.actionPlan && insights.actionPlan.length > 0 && (
          <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-8 mb-8" radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <Zap className="w-5 h-5" />
                Investment Opportunities
              </h3>
              <p className="text-sm text-white/60 mb-6">Tax-saving deductions ranked by efficiency</p>
              <div className="space-y-3">
                {insights.actionPlan.map((action, idx) => (
                  <div key={idx} className="p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-white">{action.label}</div>
                        <div className="text-xs text-white/60 mt-1">
                          Remaining capacity: {formatInr(action.remaining)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-400">
                          {formatInr(action.estimatedTaxSavedPer10k)}
                        </div>
                        <div className="text-xs text-white/50">saved per ₹10k</div>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-400 to-violet-400 h-full"
                        style={{
                          width: `${Math.min(100, ((action.deltaUsed / (action.deltaUsed + action.remaining)) * 100) || 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardSpotlight>
        )}

        {/* Stability & Recommendations */}
        {insights && (
          <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-8" radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <AlertCircle className="w-5 h-5" />
                Analysis Summary
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-semibold text-white/70 mb-3">Recommendation Stability</div>
                  <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold mb-2">
                      {insights.stability}
                    </div>
                    <p className="text-sm text-white/80 mt-3">{insights.stabilityReason}</p>
                  </div>
                </div>

                {insights.scenarios && insights.scenarios.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-white/70 mb-3">Top Scenarios</div>
                    <div className="space-y-2">
                      {insights.scenarios.slice(0, 2).map((scenario, idx) => (
                        <div key={idx} className="p-3 rounded-lg border border-white/10 bg-white/5">
                          <div className="font-medium text-white text-sm">{scenario.name}</div>
                          <div className="text-xs text-white/60 mt-1">{scenario.description}</div>
                          <div className="text-xs text-green-400 mt-2">
                            Savings: {formatInr(scenario.comparison.savings)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardSpotlight>
        )}
      </div>
    </div>
  );
}
