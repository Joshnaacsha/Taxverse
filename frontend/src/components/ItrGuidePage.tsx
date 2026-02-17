"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnalyzeResponse, SalaryResult } from "@/lib/types";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { CheckCircle2, FileText, ShieldCheck, CalendarClock, AlertTriangle } from "lucide-react";

export function ItrGuidePage() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [salary, setSalary] = useState<SalaryResult | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("taxResult");
      if (stored) setResult(JSON.parse(stored));
      const storedSalary = sessionStorage.getItem("salaryResult");
      if (storedSalary) setSalary(JSON.parse(storedSalary));
    }
  }, []);

  const personalized = useMemo(() => {
    const notes: string[] = [];
    if (result?.report) {
      const rec = result.report.options.find((o) => o.id === result.report.recommendedOptionId)?.name ?? "recommended regime";
      notes.push(`Stick with ${rec} unless your income jumps across the detected flip point.`);
    }
    if (salary?.derivedTaxInput?.hra) {
      notes.push("Keep rent receipts and landlord PAN ready for HRA.");
    }
    if ((salary?.input?.homeLoanInterestAnnual ?? 0) > 0) {
      notes.push("Collect home-loan interest certificate for 24B.");
    }
    if ((salary?.input?.investments80CAnnual ?? 0) < 150000) {
      notes.push("Room left under 80C — add ELSS/PPF/EPF proofs before filing.");
    }
    if ((salary?.input?.npsAnnual ?? 0) < 50000) {
      notes.push("Consider NPS (80CCD(1B)) if cashflow allows.");
    }
    if (salary?.tdsPlan?.taxRemaining && salary.tdsPlan.taxRemaining > 0) {
      notes.push("Plan advance tax/TDS top-up to avoid March spike and interest.");
    }
    return notes.slice(0, 5);
  }, [result?.report, salary]);

  const steps = [
    {
      title: "Collect documents",
      items: ["Form 16 (all employers)", "AIS/TIS summary", "Investment proofs (80C/NPS/loan interest)", "Rent receipts (if claiming HRA)"],
      Icon: FileText,
    },
    {
      title: "Verify income and deductions",
      items: ["Salary matches Form 16", "Interest income included", "Deductions within caps", "Regime choice consistent with proofs"],
      Icon: ShieldCheck,
    },
    {
      title: "Compute final tax and compare with TDS",
      items: ["Check total tax payable", "Subtract TDS paid", "Plan remaining tax to avoid March shock"],
      Icon: CalendarClock,
    },
    {
      title: "File and review",
      items: ["Select correct ITR form (simplified demo)", "Validate bank account and prefilled data", "E-verify immediately"],
      Icon: CheckCircle2,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black pt-10 pb-12 text-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">ITR Filing Guide (MVP)</h1>
          <p className="text-white/60 mt-2 max-w-2xl">
            A practical checklist you can demo in hackathons. This is not legal advice—always verify with official rules.
          </p>
        </div>

        {personalized.length ? (
          <CardSpotlight className="rounded-3xl border-white/10 bg-black/40 p-6 mb-8" radius={520}>
            <div className="relative z-10">
              <div className="flex items-center gap-2 font-semibold mb-3">
                <AlertTriangle className="w-5 h-5" />
                Personalized cues from your analysis
              </div>
              <ul className="space-y-2 text-sm text-white/80">
                {personalized.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-white/40">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardSpotlight>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          {steps.map((s) => (
            <CardSpotlight key={s.title} className="rounded-3xl border-white/10 bg-black/40 p-8" radius={520}>
              <div className="relative z-10">
                <div className="flex items-center gap-2 font-semibold mb-3">
                  <s.Icon className="w-5 h-5" />
                  {s.title}
                </div>
                <ul className="space-y-2 text-sm text-white/70">
                  {s.items.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-white/40">•</span>
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardSpotlight>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-100">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <AlertTriangle className="w-4 h-4" /> Common mistakes
          </div>
          <div className="text-amber-100/90">
            Missing income (interest/other employer), claiming deductions without proofs, wrong regime selection, and not e-verifying on time.
          </div>
        </div>
      </div>
    </div>
  );
}
