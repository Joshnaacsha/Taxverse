"use client";

import { useMemo, useState } from "react";
import type { AnalyzeResponse, CountryCode, IndiaItrPrefill, IndiaPersonalInfo, IndiaTaxInput, SalaryResult } from "@/lib/types";
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
import { prefillIndia } from "@/lib/api";
import { cn } from "@/lib/utils";

function readSession<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

type GuideStep = {
  title: string;
  items: string[];
  Icon: React.ComponentType<{ className?: string }>;
};

type GuideContent = {
  pageTitle: string;
  subtitle: string;
  steps: GuideStep[];
  mistakes: string;
};

const COUNTRY_LABEL: Record<CountryCode, string> = {
  IN: "India",
  US: "United States",
  UK: "United Kingdom",
  SG: "Singapore",
  AE: "UAE",
};

const DEFAULT_IN_PREFILL: IndiaTaxInput = {
  annualSalary: 720000,
  otherIncome: 0,
  deductions80C: 0,
  hra: 0,
  homeLoanInterest: 0,
  nps: 0,
};

const GUIDE_BY_COUNTRY: Record<CountryCode, GuideContent> = {
  IN: {
    pageTitle: "ITR Filing Guide",
    subtitle: "A simple, step-by-step workflow to file accurately and on time in India.",
    steps: [
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
    ],
    mistakes:
      "Missing interest income, claiming deductions without proofs, choosing the wrong regime, and delaying e-verification.",
  },
  US: {
    pageTitle: "Tax Filing Guide",
    subtitle: "A practical filing workflow for US federal return preparation.",
    steps: [
      {
        title: "Gather Tax Forms",
        items: ["W-2/1099 forms", "Interest/dividend statements", "Mortgage/student-loan interest forms", "Prior-year return copy"],
        Icon: FileText,
      },
      {
        title: "Set Filing Profile",
        items: ["Confirm filing status", "Choose standard vs itemized deductions", "Review dependents and credits", "Check estimated tax payments made"],
        Icon: ShieldCheck,
      },
      {
        title: "Reconcile Taxes",
        items: ["Calculate total tax", "Subtract withholding and credits", "Review refund or balance due"],
        Icon: CalendarClock,
      },
      {
        title: "File And Keep Records",
        items: ["Submit federal return (and state return if applicable)", "Schedule payment if tax due", "Save IRS/state acknowledgements"],
        Icon: CheckCircle2,
      },
    ],
    mistakes:
      "Missing 1099 income, wrong filing status, ignoring state return obligations, and underpayment due to no quarterly planning.",
  },
  UK: {
    pageTitle: "Tax Filing Guide",
    subtitle: "A simple checklist for UK self-assessment readiness and filing.",
    steps: [
      {
        title: "Collect Income Records",
        items: ["P60/P45 details", "Self-employment or side-income records", "Bank interest/dividend statements", "Pension and benefit records"],
        Icon: FileText,
      },
      {
        title: "Validate Allowances",
        items: ["Check tax code (PAYE)", "Confirm personal allowance usage", "Review pension/gift-aid claims", "Verify allowable business expenses"],
        Icon: ShieldCheck,
      },
      {
        title: "Estimate Payment",
        items: ["Compute tax due", "Include payments on account if required", "Check penalties/interest risk for delay"],
        Icon: CalendarClock,
      },
      {
        title: "Submit Return",
        items: ["File self-assessment return", "Pay by due date", "Store HMRC confirmations and computation"],
        Icon: CheckCircle2,
      },
    ],
    mistakes:
      "Wrong tax code assumptions, missing side-income disclosure, skipping payments on account, and late online filing.",
  },
  SG: {
    pageTitle: "Tax Filing Guide",
    subtitle: "A concise workflow for Singapore personal tax filing and review.",
    steps: [
      {
        title: "Prepare Statements",
        items: ["Employment income details", "Other taxable income records", "Relief/deduction support documents", "Prior filing reference"],
        Icon: FileText,
      },
      {
        title: "Review Tax Position",
        items: ["Confirm income auto-inclusions", "Validate tax relief eligibility", "Check residency assumptions", "Review spouse/child-related claims"],
        Icon: ShieldCheck,
      },
      {
        title: "Check Liability",
        items: ["Estimate final tax bill", "Compare with notices/withholding", "Plan installment payment if required"],
        Icon: CalendarClock,
      },
      {
        title: "File And Archive",
        items: ["Submit return before deadline", "Verify assessment details", "Retain records for audit trail"],
        Icon: CheckCircle2,
      },
    ],
    mistakes:
      "Missing taxable side income, claiming ineligible reliefs, residency misclassification, and weak record retention.",
  },
  AE: {
    pageTitle: "Tax Filing Guide",
    subtitle: "A practical compliance checklist for UAE tax-related documentation and filings where applicable.",
    steps: [
      {
        title: "Collect Core Records",
        items: ["Salary and employment records", "Business income records (if any)", "Residency documentation", "VAT/corporate tax docs if applicable"],
        Icon: FileText,
      },
      {
        title: "Confirm Obligations",
        items: ["Check if personal return is required in your situation", "Assess VAT registration/filing obligations", "Assess corporate tax relevance for your entity", "Validate taxable presence rules"],
        Icon: ShieldCheck,
      },
      {
        title: "Review Payments",
        items: ["Compute any payable amount", "Validate prior payments/credits", "Schedule payments before due dates"],
        Icon: CalendarClock,
      },
      {
        title: "Submit And Preserve",
        items: ["File required declarations", "Keep proof of filings and payments", "Retain supporting records for compliance checks"],
        Icon: CheckCircle2,
      },
    ],
    mistakes:
      "Assuming no filing applies in every case, weak VAT/corporate tax checks for business income, and poor record keeping.",
  },
};

export function ItrGuidePage() {
  const [result] = useState<AnalyzeResponse | null>(() => readSession<AnalyzeResponse>("taxResult"));
  const [salary] = useState<SalaryResult | null>(() => readSession<SalaryResult>("salaryResult"));
  const [taxInputCountry] = useState<CountryCode | null>(() => readSession<{ country: CountryCode }>("taxInput")?.country ?? null);
  const [savedCountry] = useState<CountryCode | null>(() => readSession<CountryCode>("itrGuideCountry"));

  const detectedCountry: CountryCode =
    result?.report?.country ?? result?.country ?? taxInputCountry ?? "IN";
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(savedCountry ?? detectedCountry);

  const savedTaxInput = readSession<{ country: CountryCode; input: IndiaTaxInput }>("taxInput-IN")
    ?? (readSession<{ country: CountryCode; input: IndiaTaxInput }>("taxInput")?.country === "IN"
      ? readSession<{ country: CountryCode; input: IndiaTaxInput }>("taxInput")
      : null);
  const [prefillInput, setPrefillInput] = useState<IndiaTaxInput>(savedTaxInput?.input ?? DEFAULT_IN_PREFILL);
  const [prefillPersonal, setPrefillPersonal] = useState<IndiaPersonalInfo>({});
  const [prefillResult, setPrefillResult] = useState<IndiaItrPrefill | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillError, setPrefillError] = useState<string | null>(null);

  const onCountryChange = (next: CountryCode) => {
    setSelectedCountry(next);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("itrGuideCountry", JSON.stringify(next));
    }
  };

  const content = GUIDE_BY_COUNTRY[selectedCountry];

  const personalized = useMemo(() => {
    const notes: string[] = [];
    const report = result?.report;

    if (report) {
      const rec = report.options.find((o) => o.id === report.recommendedOptionId)?.name ?? "recommended regime";
      notes.push(`Current best tax option for ${COUNTRY_LABEL[selectedCountry]}: ${rec}. Recheck if your income changes materially.`);
    }

    if (selectedCountry === "IN") {
      if (salary?.derivedTaxInput?.hra) notes.push("Keep rent receipts and landlord PAN ready for HRA.");
      if ((salary?.input?.homeLoanInterestAnnual ?? 0) > 0) notes.push("Collect home-loan interest certificate for Section 24B.");
      if ((salary?.input?.investments80CAnnual ?? 0) < 150000) notes.push("You still have room under 80C. Add eligible proofs before filing.");
      if (salary?.tdsPlan?.taxRemaining && salary.tdsPlan.taxRemaining > 0) notes.push("Plan TDS top-up early to avoid end-of-year pressure.");
    } else if (selectedCountry === "US") {
      notes.push("Recheck filing status and compare standard vs itemized deduction before final submission.");
      notes.push("Ensure W-2/1099 income and state-tax obligations are both covered.");
    } else if (selectedCountry === "UK") {
      notes.push("Review PAYE tax code and include non-PAYE income in self-assessment if applicable.");
      notes.push("Check whether payments on account apply for your case.");
    } else if (selectedCountry === "SG") {
      notes.push("Validate relief eligibility and keep supporting records for each claim.");
      notes.push("Confirm all taxable income streams are included before submission.");
    } else if (selectedCountry === "AE") {
      notes.push("Confirm whether your case has VAT or corporate-tax obligations.");
      notes.push("Maintain organized compliance records even when personal tax is limited.");
    }

    return notes.slice(0, 5);
  }, [result?.report, salary, selectedCountry]);

  const onPrefill = async () => {
    setPrefillLoading(true);
    setPrefillError(null);
    try {
      const res = await prefillIndia({ input: prefillInput, personal: prefillPersonal });
      setPrefillResult(res);
    } catch (e) {
      setPrefillError(e instanceof Error ? e.message : "Prefill failed");
    } finally {
      setPrefillLoading(false);
    }
  };

  return (
    <div className={`${uiTheme.page} relative overflow-hidden pb-12 pt-10 text-white`}>
      <Spotlight className="-top-44 left-0" fill="rgba(14,165,233,0.25)" />
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h1 className="bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-400 bg-clip-text text-4xl font-bold text-transparent">
            {content.pageTitle}
          </h1>
          <p className={`${uiTheme.textMuted} mt-2 max-w-2xl`}>
            {content.subtitle}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className={`inline-flex items-center gap-2 rounded-full border border-cyan-300/25 px-3 py-1 text-xs ${uiTheme.panelSoft}`}>
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300" />
              Country: {COUNTRY_LABEL[selectedCountry]}
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-white/80">
              <span className="font-medium">Change country:</span>
              <select
                value={selectedCountry}
                onChange={(e) => onCountryChange(e.target.value as CountryCode)}
                className="h-8 rounded-md border border-cyan-300/25 bg-slate-900/80 px-2 text-xs text-white focus:border-cyan-300/55 focus:outline-none"
              >
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="SG">Singapore</option>
                <option value="AE">UAE</option>
              </select>
            </label>
          </div>
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

        {selectedCountry === "IN" ? (
          <CardSpotlight className={`mb-10 rounded-3xl p-6 ${uiTheme.panel}`} radius={520}>
            <div className="relative z-10">
              <div className="mb-3 flex items-center gap-2 font-semibold">
                <FileText className="h-5 w-5 text-cyan-300" />
                ITR Prefill (India)
              </div>
              <p className={`text-sm ${uiTheme.textMuted}`}>
                Add 80C and freelancing income to generate a prefilled ITR-1 style summary.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <label className="grid gap-2">
                  <div className="text-sm font-medium text-white">Annual Salary</div>
                  <input
                    type="number"
                    value={prefillInput.annualSalary}
                    onChange={(e) => setPrefillInput({ ...prefillInput, annualSalary: Number(e.target.value) })}
                    className={cn("h-10 rounded-xl px-3 text-sm", uiTheme.field)}
                  />
                </label>
                <label className="grid gap-2">
                  <div className="text-sm font-medium text-white">Freelancing / Side Income</div>
                  <input
                    type="number"
                    value={prefillInput.otherIncome}
                    onChange={(e) => setPrefillInput({ ...prefillInput, otherIncome: Number(e.target.value) })}
                    className={cn("h-10 rounded-xl px-3 text-sm", uiTheme.field)}
                  />
                </label>
                <label className="grid gap-2">
                  <div className="text-sm font-medium text-white">Section 80C</div>
                  <input
                    type="number"
                    value={prefillInput.deductions80C}
                    onChange={(e) => setPrefillInput({ ...prefillInput, deductions80C: Number(e.target.value) })}
                    className={cn("h-10 rounded-xl px-3 text-sm", uiTheme.field)}
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="grid gap-2">
                  <div className="text-sm font-medium text-white">HRA Exemption</div>
                  <input
                    type="number"
                    value={prefillInput.hra}
                    onChange={(e) => setPrefillInput({ ...prefillInput, hra: Number(e.target.value) })}
                    className={cn("h-10 rounded-xl px-3 text-sm", uiTheme.field)}
                  />
                </label>
                <label className="grid gap-2">
                  <div className="text-sm font-medium text-white">NPS (80CCD)</div>
                  <input
                    type="number"
                    value={prefillInput.nps}
                    onChange={(e) => setPrefillInput({ ...prefillInput, nps: Number(e.target.value) })}
                    className={cn("h-10 rounded-xl px-3 text-sm", uiTheme.field)}
                  />
                </label>
                <label className="grid gap-2">
                  <div className="text-sm font-medium text-white">Home Loan Interest</div>
                  <input
                    type="number"
                    value={prefillInput.homeLoanInterest}
                    onChange={(e) => setPrefillInput({ ...prefillInput, homeLoanInterest: Number(e.target.value) })}
                    className={cn("h-10 rounded-xl px-3 text-sm", uiTheme.field)}
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="grid gap-2">
                  <div className="text-sm font-medium text-white">Full Name (optional)</div>
                  <input
                    type="text"
                    value={prefillPersonal.fullName ?? ""}
                    onChange={(e) => setPrefillPersonal({ ...prefillPersonal, fullName: e.target.value })}
                    className={cn("h-10 rounded-xl px-3 text-sm", uiTheme.field)}
                  />
                </label>
                <label className="grid gap-2">
                  <div className="text-sm font-medium text-white">PAN (optional)</div>
                  <input
                    type="text"
                    value={prefillPersonal.pan ?? ""}
                    onChange={(e) => setPrefillPersonal({ ...prefillPersonal, pan: e.target.value })}
                    className={cn("h-10 rounded-xl px-3 text-sm", uiTheme.field)}
                  />
                </label>
                <label className="grid gap-2">
                  <div className="text-sm font-medium text-white">Date of Birth (optional)</div>
                  <input
                    type="text"
                    value={prefillPersonal.dateOfBirth ?? ""}
                    onChange={(e) => setPrefillPersonal({ ...prefillPersonal, dateOfBirth: e.target.value })}
                    className={cn("h-10 rounded-xl px-3 text-sm", uiTheme.field)}
                    placeholder="YYYY-MM-DD"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onPrefill}
                  disabled={prefillLoading}
                  className={cn("inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold", uiTheme.cta)}
                >
                  {prefillLoading ? "Generating..." : "Generate Prefill"}
                </button>
                {prefillError ? <div className="text-sm text-rose-300">{prefillError}</div> : null}
              </div>

              {prefillResult ? (
                <div className="mt-6 grid gap-4">
                  {prefillResult.sections.map((section) => (
                    <div key={section.name} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                      <div className="mb-3 text-sm font-semibold text-white">{section.name}</div>
                      <div className="grid gap-2 md:grid-cols-2">
                        {section.fields.map((field) => (
                          <div key={field.key} className="flex items-center justify-between gap-3 text-sm">
                            <span className={uiTheme.textMuted}>{field.label}</span>
                            <span className="font-semibold text-white">
                              {field.value !== null && field.value !== "" ? field.value : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </CardSpotlight>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          {content.steps.map((s, idx) => (
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
            {content.mistakes}
          </div>
        </div>
      </div>
    </div>
  );
}
