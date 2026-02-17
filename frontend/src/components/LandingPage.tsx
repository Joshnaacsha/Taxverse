"use client";

import Link from "next/link";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Globe } from "@/components/magicui/globe";
import { Spotlight } from "@/components/ui/spotlight";
import { Zap, TrendingUp, Cpu, Target, BarChart3 } from "lucide-react";

function CTAButton(props: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-slate-950 bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 shadow-[0_10px_40px_rgba(56,189,248,0.25)] hover:shadow-[0_12px_50px_rgba(56,189,248,0.35)] transition";
  if (props.href) {
    return (
      <Link href={props.href} className={`${base} ${props.className ?? ""}`}>
        {props.children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={props.onClick} className={`${base} ${props.className ?? ""}`}>
      {props.children}
    </button>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <AuroraBackground className="h-screen justify-center bg-zinc-950 text-white dark:bg-zinc-950 dark:text-white">
        <Spotlight className="-top-40 left-0" fill="rgba(56, 189, 248, 0.35)" />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
          <div className="grid h-full items-center gap-12 lg:grid-cols-2">
            <div className="flex flex-col justify-center">
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-slate-800/70 px-3 py-1 text-xs text-white/88">
                Global Tax Decision Intelligence
              </div>
              <h1 className="mb-4 text-5xl font-bold tracking-tight md:text-6xl">Taxverse</h1>
              <p className="mb-2 bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-lg font-semibold text-transparent text-white/88">
                Clarity for Complex Tax Systems
              </p>
              <p className="mb-8 max-w-xl text-base text-white/72">
                Analyze taxes across countries, understand how your numbers are calculated, and explore future scenarios. Built for accuracy, designed for clarity.
              </p>

              <div className="flex flex-col items-start gap-4 sm:flex-row">
                <CTAButton href="/salary" className="w-full sm:w-auto">
                  Analyze Salary Slip
                </CTAButton>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-4 text-sm">
                <div className="rounded-lg border border-white/20 bg-slate-800/70 p-4">
                  <div className="mb-2 flex justify-center">
                    <BarChart3 className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className="font-semibold text-white/90">Compare</div>
                  <div className="mt-1 text-xs text-white/72">Country Tax Options</div>
                </div>
                <div className="rounded-lg border border-white/20 bg-slate-800/70 p-4">
                  <div className="mb-2 flex justify-center">
                    <Cpu className="h-6 w-6 text-violet-400" />
                  </div>
                  <div className="font-semibold text-white/90">AI-Powered</div>
                  <div className="mt-1 text-xs text-white/72">Smart Explanations</div>
                </div>
                <div className="rounded-lg border border-white/20 bg-slate-800/70 p-4">
                  <div className="mb-2 flex justify-center">
                    <TrendingUp className="h-6 w-6 text-fuchsia-400" />
                  </div>
                  <div className="font-semibold text-white/90">File Better</div>
                  <div className="mt-1 text-xs text-white/72">Actionable Next Steps</div>
                </div>
              </div>
            </div>

            <div className="hidden items-center justify-center lg:flex">
              <div className="relative mx-auto aspect-square w-full max-w-[520px]">
                <Globe className="inset-0 h-full w-full" />
                <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.22),rgba(2,6,23,0)_62%)]" />
              </div>
            </div>
          </div>
        </div>
      </AuroraBackground>

      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">Why Taxverse?</h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-white/20 bg-slate-800/70 p-8">
            <div className="mb-4 flex items-center gap-3">
              <Target className="h-8 w-8 text-cyan-400" />
              <h3 className="text-xl font-semibold">Precise Recommendations</h3>
            </div>
            <p className="text-white/78">Get clear recommendations based on your salary, deductions, and investments.</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-slate-800/70 p-8">
            <div className="mb-4 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-violet-400" />
              <h3 className="text-xl font-semibold">Long-term Projections</h3>
            </div>
            <p className="text-white/78">See if your recommendation still makes sense when your income grows in future years.</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-slate-800/70 p-8">
            <div className="mb-4 flex items-center gap-3">
              <Cpu className="h-8 w-8 text-fuchsia-400" />
              <h3 className="text-xl font-semibold">AI Insights</h3>
            </div>
            <p className="text-white/78">Ask follow-up questions and get plain-language explanations based on your own numbers.</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-slate-800/70 p-8">
            <div className="mb-4 flex items-center gap-3">
              <Zap className="h-8 w-8 text-amber-400" />
              <h3 className="text-xl font-semibold">Action Plans</h3>
            </div>
            <p className="text-white/78">Get a simple action list showing where extra investment can lower your tax the most.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <h3 className="mb-6 text-xl font-semibold text-white/90">How It Works</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-cyan-300/20 bg-slate-900/60 p-5">
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-cyan-200/80">Step 1</div>
            <div className="font-semibold">Add your details</div>
            <div className="mt-1 text-sm text-white/72">Upload salary slip for India or enter income for other countries.</div>
          </div>
          <div className="rounded-2xl border border-sky-300/20 bg-slate-900/60 p-5">
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-sky-200/80">Step 2</div>
            <div className="font-semibold">Compare outcomes</div>
            <div className="mt-1 text-sm text-white/72">Review tax options, projections, and what-if scenarios in one place.</div>
          </div>
          <div className="rounded-2xl border border-blue-300/20 bg-slate-900/60 p-5">
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-blue-200/80">Step 3</div>
            <div className="font-semibold">Take action</div>
            <div className="mt-1 text-sm text-white/72">Use clear next-step suggestions and ask follow-up questions in Q&A.</div>
          </div>
        </div>
      </div>

    </div>
  );
}
