"use client";

import Link from "next/link";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Globe } from "@/components/magicui/globe";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { NoiseBackground } from "@/components/ui/noise-background";
import { cn } from "@/lib/utils";
import { Zap, TrendingUp, Cpu, Target, BarChart3 } from "lucide-react";

function NoiseButton(props: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <NoiseBackground
      containerClassName={cn("inline-block rounded-xl p-1", props.className)}
      className="p-0"
      gradientColors={["rgb(56, 189, 248)", "rgb(168, 85, 247)", "rgb(236, 72, 153)"]}
      noiseIntensity={0.22}
      speed={0.13}
      backdropBlur
    >
      {props.href ? (
        <Link
          href={props.href}
          className="inline-block w-full rounded-[0.7rem] bg-black/80 font-semibold text-white ring-1 ring-white/10 hover:bg-black/60 transition-colors px-6 py-3 text-sm"
        >
          {props.children}
        </Link>
      ) : (
        <button
          type="button"
          onClick={props.onClick}
          className="w-full rounded-[0.7rem] bg-black/80 font-semibold text-white ring-1 ring-white/10 hover:bg-black/60 transition-colors px-6 py-3 text-sm"
        >
          {props.children}
        </button>
      )}
    </NoiseBackground>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <AuroraBackground className="h-screen justify-center bg-zinc-950 text-white dark:bg-zinc-950 dark:text-white">
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2 h-full">
            <div className="flex flex-col justify-center">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 mb-4">
                ✨ AI-Powered Tax Optimizer
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
                RegimeIQ
              </h1>
              <p className="text-lg text-white/80 mb-2 bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent font-semibold">
                Choose Your Tax Regime Wisely
              </p>
              <p className="text-base text-white/60 mb-8 max-w-xl">
                Get AI-powered tax regime recommendations tailored to your financial situation. Compare regimes, project outcomes, and optimize your tax liability with confidence.
              </p>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
                <NoiseButton href="/salary" className="w-full sm:w-auto">
                  Analyze Salary Slip
                </NoiseButton>
                <Link
                  href="/insights"
                  className="px-6 py-3 rounded-xl border border-white/20 text-white/80 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                >
                  Learn More
                </Link>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-4 text-sm">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex justify-center"><BarChart3 className="w-6 h-6 text-cyan-400" /></div>
                  <div className="font-semibold text-white/90">Compare</div>
                  <div className="text-white/60 text-xs mt-1">Old vs New Regime</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex justify-center"><Cpu className="w-6 h-6 text-violet-400" /></div>
                  <div className="font-semibold text-white/90">AI-Powered</div>
                  <div className="text-white/60 text-xs mt-1">Smart Analysis</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex justify-center"><TrendingUp className="w-6 h-6 text-fuchsia-400" /></div>
                  <div className="font-semibold text-white/90">Optimize</div>
                  <div className="text-white/60 text-xs mt-1">Maximize Savings</div>
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md hidden lg:block">
              <div className="relative flex items-center justify-center overflow-hidden rounded-lg">
                <span className="pointer-events-none absolute z-10 bg-gradient-to-b from-white to-white/40 bg-clip-text text-center text-6xl leading-none font-bold whitespace-pre-wrap text-transparent">
                  Global<br />Insights
                </span>
                <Globe className="top-12 absolute z-0" />
                <div className="pointer-events-none absolute inset-0 h-full bg-[radial-gradient(circle_at_50%_200%,rgba(255,255,255,0.1),rgba(255,255,255,0))]" />
              </div>
            </div>
          </div>
        </div>
      </AuroraBackground>

      {/* Features Section */}
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why RegimeIQ?</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <div className="mb-4 flex items-center gap-3">
              <Target className="w-8 h-8 text-cyan-400" />
              <h3 className="text-xl font-semibold">Precise Recommendations</h3>
            </div>
            <p className="text-white/70">Get data-driven recommendations based on your complete financial profile including salary, deductions, and investments.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <div className="mb-4 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-violet-400" />
              <h3 className="text-xl font-semibold">Long-term Projections</h3>
            </div>
            <p className="text-white/70">See how your recommendation holds up as your salary grows, with multi-year projections and scenario analysis.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <div className="mb-4 flex items-center gap-3">
              <Cpu className="w-8 h-8 text-fuchsia-400" />
              <h3 className="text-xl font-semibold">AI Insights</h3>
            </div>
            <p className="text-white/70">Ask follow-up questions and get explanations grounded in your specific tax situation and recommendations.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <div className="mb-4 flex items-center gap-3">
              <Zap className="w-8 h-8 text-amber-400" />
              <h3 className="text-xl font-semibold">Action Plans</h3>
            </div>
            <p className="text-white/70">Get prioritized deduction opportunities with estimated savings per ₹10,000 invested.</p>
          </div>
        </div>
      </div>

      <div className="text-center py-10 text-xs text-white/40 border-t border-white/10">
        Built for demo • Verify with official tax rules before making decisions
      </div>
    </div>
  );
}
