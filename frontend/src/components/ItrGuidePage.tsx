"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnalyzeResponse, SalaryResult } from "@/lib/types";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Spotlight } from "@/components/ui/spotlight";
import {
  AlertTriangle,
  FileText,
  ShieldCheck,
  CalendarClock,
  CheckCircle2,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import { uiTheme } from "@/lib/uiTheme";

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
    const report = result?.report;
    if (report) {
      const rec = report.options.find((o) => o.id === report.recommendedOptionId)?.name ?? "recommended regime";
      notes.push(`Follow ${rec} unless your annual income changes significantly.`);
    }
    if (salary?.derivedTaxInput?.hra) notes.push("Keep rent receipts and landlord PAN ready for HRA.");
    if ((salary?.input?.homeLoanInterestAnnual ?? 0) > 0) notes.push("Collect home-loan interest certificate for Section 24B.");
    if ((salary?.input?.investments80CAnnual ?? 0) < 150000) notes.push("You still have room under 80C. Add eligible proofs before filing.");
    if (salary?.tdsPlan?.taxRemaining && salary.tdsPlan.taxRemaining > 0) notes.push("Plan TDS top-up early to avoid end-of-year pressure.");
    return notes.slice(0, 5);
  }, [result?.report, salary]);

  const steps = [
    {
      title: "Collect Documents",
      items: ["Form 16 (all employers)", "AIS/TIS summary", "80C/NPS/home-loan proofs", "Rent receipts if claiming HRA"],
      Icon: FileText,
    },
    {
      title: "Verify Figures",
      items: ["Salary matches Form 16", "Other income is included", "Deductions are under limits", "Regime matches your proofs"],
      Icon: ShieldCheck,
    },
    {
      title: "Check Balance Tax",
      items: ["Confirm total tax payable", "Subtract TDS already paid", "Plan remaining tax before filing"],
      Icon: CalendarClock,
    },
    {
      title: "File And E-Verify",
      items: ["Select the right ITR form", "Validate bank and personal details", "E-verify immediately after submit"],
      Icon: CheckCircle2,
    },
  ];

  return (
    <div className={`${uiTheme.page} relative overflow-hidden pb-12 pt-10 text-white`}>
      <Spotlight className="-top-44 left-0" fill="rgba(14,165,233,0.25)" />
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h1 className="bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-400 bg-clip-text text-4xl font-bold text-transparent">
            ITR Filing Guide
          </h1>
          <p className={`${uiTheme.textMuted} mt-2 max-w-2xl`}>
            A simple, step-by-step workflow to file accurately and on time.
          </p>
        </div>

        {personalized.length ? (
          <CardSpotlight className={`mb-8 rounded-3xl p-6 ${uiTheme.panel}`} radius={520}>
            <div className="relative z-10">
              <div className="mb-3 flex items-center gap-2 font-semibold">
                <Sparkles className="h-5 w-5 text-cyan-300" />
                Personalized Checklist
              </div>
              <ul className={`space-y-3 text-sm ${uiTheme.textBody}`}>
                {personalized.map((item) => (
                  <li key={item} className="flex gap-2">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardSpotlight>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          {steps.map((s, idx) => (
            <CardSpotlight key={s.title} className={`rounded-3xl p-8 ${uiTheme.panel}`} radius={520}>
              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-400/10 text-sm font-semibold text-cyan-200">
                    {idx + 1}
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <s.Icon className="h-5 w-5 text-cyan-300" />
                    {s.title}
                  </div>
                </div>
                <ul className={`space-y-2 text-sm ${uiTheme.textMuted}`}>
                  {s.items.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-white/56">-</span>
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardSpotlight>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-100">
          <div className="mb-1 flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" /> Common mistakes to avoid
          </div>
          <div className="text-amber-100/90">
            Missing interest income, claiming deductions without proofs, choosing the wrong regime, and delaying e-verification.
          </div>
        </div>
      </div>
    </div>
  );
}
