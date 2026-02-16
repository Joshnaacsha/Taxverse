"use client";

import { useEffect, useState } from "react";
import type { AnalyzeResponse } from "@/lib/types";
import { formatInr, formatPct } from "@/lib/format";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { NoiseBackground } from "@/components/ui/noise-background";
import { cn } from "@/lib/utils";
import { TrendingUp, PieChart as PieChartIcon, BarChart3, MessageCircle, AlertCircle, DollarSign } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
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
        className={cn(
          "w-full rounded-[0.7rem] bg-black/80 font-semibold text-white ring-1 ring-white/10 hover:bg-black/60",
          "transition-colors",
          sizeClass
        )}
      >
        {props.children}
      </button>
    </NoiseBackground>
  );
}

function Stat(props: { label: string; value: string; trend?: "up" | "down" | "neutral"; icon?: React.ReactNode }) {
  const trendColor = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-white/70",
  }[props.trend ?? "neutral"];

  const trendIcon = {
    up: "↑",
    down: "↓",
    neutral: "→",
  }[props.trend ?? "neutral"];

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
        {props.icon}
        {props.label}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold text-white">{props.value}</div>
        <div className={`text-lg ${trendColor}`}>{trendIcon}</div>
      </div>
    </div>
  );
}

export function ResultsPage() {
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
        <div className="text-white/60">Loading results...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black pt-8 pb-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">No Results Found</h1>
            <p className="text-white/60 mb-8">Please run the calculator first to see results.</p>
          </div>
        </div>
      </div>
    );
  }

  const summary = result.comparisonResult;
  const insights = result.insights;
  const projection = result.projection || [];
  const savings = summary?.savings ?? 0;
  const recommended = summary?.recommended;

  // Prepare chart data
  const comparisonData = [
    {
      name: "Old Regime",
      tax: summary?.oldRegime.totalTax || 0,
      effectiveRate: summary?.oldRegime.effectiveRatePct || 0,
    },
    {
      name: "New Regime",
      tax: summary?.newRegime.totalTax || 0,
      effectiveRate: summary?.newRegime.effectiveRatePct || 0,
    },
  ];

  const taxBreakdownData = [
    {
      name: "Gross Income",
      value: summary?.grossIncome || 0,
    },
    {
      name: recommended === "Old Regime" ? "Old Regime Tax" : "New Regime Tax",
      value:
        recommended === "Old Regime"
          ? summary?.oldRegime.totalTax || 0
          : summary?.newRegime.totalTax || 0,
    },
  ];

  const COLORS = ["#0ea5e9", "#a855f7", "#ec4899", "#f97316"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black pt-8 pb-12">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Analysis Results</h1>
          <p className="text-white/60">
            {summary?.financialYear} • Recommended: <span className="font-semibold text-cyan-400">{recommended}</span> •
            Potential Savings: <span className="font-semibold text-green-400">{formatInr(savings)}</span>
          </p>
        </div>

        {/* Executive Summary */}
        <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-8 mb-8" radius={420}>
          <div className="relative z-10">
            {result.executiveSummary?.headline && (
              <div className="mb-6">
                <div className="text-sm font-semibold text-white/70 uppercase mb-3">Executive Summary</div>
                <TextGenerateEffect words={result.executiveSummary.headline} duration={0.25} filter={false} />
                {result.executiveSummary.bullets?.length ? (
                  <ul className="mt-4 space-y-2 text-sm text-white/70">
                    {result.executiveSummary.bullets.map((b, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-cyan-400 mt-1">✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </div>
        </CardSpotlight>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat label="Gross Income" value={formatInr(summary?.grossIncome || 0)} icon={<DollarSign className="w-4 h-4 text-cyan-400" />} />
          <Stat
            label="Tax (Recommended)"
            value={formatInr(recommended === "Old Regime" ? summary?.oldRegime.totalTax || 0 : summary?.newRegime.totalTax || 0)}
            trend="down"
            icon={<BarChart3 className="w-4 h-4 text-violet-400" />}
          />
          <Stat
            label="Effective Tax Rate"
            value={formatPct(
              recommended === "Old Regime" ? summary?.oldRegime.effectiveRatePct || 0 : summary?.newRegime.effectiveRatePct || 0
            )}
            icon={<TrendingUp className="w-4 h-4 text-amber-400" />}
          />
          <Stat label="Savings" value={formatInr(savings)} trend="up" icon={<TrendingUp className="w-4 h-4 text-green-400" />} />
        </div>

        {/* Visualizations */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Tax Comparison */}
          <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-8" radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-6">
                <BarChart3 className="w-5 h-5" />
                Regime Comparison
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <defs>
                    <linearGradient id="colorOld" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" />
                  <YAxis stroke="rgba(255,255,255,0.3)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    formatter={(value) => formatInr(value as number)}
                  />
                  <Bar dataKey="tax" fill="url(#colorOld)" name="Total Tax" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardSpotlight>

          {/* Income Distribution */}
          <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-8" radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-6">
                <PieChartIcon className="w-5 h-5" />
                Income Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={taxBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {taxBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatInr(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardSpotlight>
        </div>

        {/* Projection Chart */}
        {projection.length > 0 && (
          <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-8 mb-8" radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-6">
                <TrendingUp className="w-5 h-5" />
                5-Year Projection
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={projection}>
                  <defs>
                    <linearGradient id="colorOldTax" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorNewTax" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" stroke="rgba(255,255,255,0.3)" />
                  <YAxis stroke="rgba(255,255,255,0.3)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    formatter={(value) => formatInr(value as number)}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="oldTax" stroke="#ec4899" strokeWidth={2.5} name="Old Regime Tax" dot={{ fill: "#ec4899", r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="newTax" stroke="#0ea5e9" strokeWidth={2.5} name="New Regime Tax" dot={{ fill: "#0ea5e9", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardSpotlight>
        )}

        {/* Action Plan */}
        {insights?.actionPlan && insights.actionPlan.length > 0 && (
          <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-8 mb-8" radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <TrendingUp className="w-5 h-5" />
                Recommended Actions
              </h3>
              <p className="text-sm text-white/60 mb-6">Best next steps to optimize your tax liability</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.actionPlan.slice(0, 6).map((action, idx) => (
                  <div key={idx} className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-white text-sm">{action.label}</div>
                      <div className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                        {formatInr(action.estimatedTaxSavedPer10k)}/10k
                      </div>
                    </div>
                    <div className="text-xs text-white/60">
                      <div>Remaining: {formatInr(action.remaining)}</div>
                      <div className="mt-1">Used: {formatInr(action.deltaUsed)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardSpotlight>
        )}

        {/* Insights & Stability */}
        {insights && (
          <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-8 mb-8" radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <AlertCircle className="w-5 h-5" />
                Key Insights
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-semibold text-white/70 mb-2">Stability Analysis</div>
                  <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="text-2xl font-bold text-cyan-400">{insights.stability}</div>
                    <p className="text-xs text-white/60 mt-2">{insights.stabilityReason}</p>
                  </div>
                </div>
                {insights.scenarios && insights.scenarios.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-white/70 mb-2">Scenario Summary</div>
                    <div className="space-y-2">
                      {insights.scenarios.slice(0, 3).map((scenario, idx) => (
                        <div key={idx} className="p-3 rounded-lg border border-white/10 bg-white/5 text-xs">
                          <div className="font-medium text-white">{scenario.name}</div>
                          <div className="text-white/60">{scenario.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardSpotlight>
        )}

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <NoiseButton onClick={() => window.location.href = "/insights"}>
            View Detailed Insights
          </NoiseButton>
          <NoiseButton onClick={() => window.location.href = "/qa"}>
            Ask Questions
          </NoiseButton>
        </div>
      </div>
    </div>
  );
}
