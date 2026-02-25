"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AnalyzeResponse, CountryCode, IndiaItrPrefill, IndiaPersonalInfo, IndiaTaxInput, SalaryResult } from "@/lib/types";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Spotlight } from "@/components/ui/spotlight";
import { AuroraBackground } from "@/components/ui/aurora-background";
import {
  AlertTriangle,
  FileText,
  ShieldCheck,
  CalendarClock,
  CheckCircle2,
  BadgeCheck,
  Sparkles,
  ChevronDown,
  Download,
  Printer,
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

const COUNTRY_OPTIONS: Array<{ value: CountryCode; label: string }> = [
  { value: "IN", label: "India" },
  { value: "US", label: "United States" },
  { value: "UK", label: "United Kingdom" },
  { value: "SG", label: "Singapore" },
  { value: "AE", label: "UAE" },
];

const DEFAULT_IN_PREFILL: IndiaTaxInput = {
  annualSalary: 720000,
  otherIncome: 0,
  deductions80C: 0,
  hra: 0,
  homeLoanInterest: 0,
  nps: 0,
};

function isIndiaInput(input: unknown): input is IndiaTaxInput {
  if (!input || typeof input !== "object") return false;
  const obj = input as Record<string, unknown>;
  return (
    typeof obj.annualSalary === "number" &&
    typeof obj.otherIncome === "number" &&
    typeof obj.deductions80C === "number" &&
    typeof obj.hra === "number" &&
    typeof obj.homeLoanInterest === "number" &&
    typeof obj.nps === "number"
  );
}

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
  const [prefillPersonal, setPrefillPersonal] = useState<IndiaPersonalInfo>(() => readSession<IndiaPersonalInfo>("itrPersonal-IN") ?? {});
  const [prefillResult, setPrefillResult] = useState<IndiaItrPrefill | null>(null);
  const [draftInputUsed, setDraftInputUsed] = useState<IndiaTaxInput | null>(null);
  const [draftGeneratedAt, setDraftGeneratedAt] = useState<string | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillError, setPrefillError] = useState<string | null>(null);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const countryMenuRef = useRef<HTMLDivElement>(null);

  const onCountryChange = (next: CountryCode) => {
    setSelectedCountry(next);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("itrGuideCountry", JSON.stringify(next));
    }
  };

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!countryMenuRef.current) return;
      if (!countryMenuRef.current.contains(event.target as Node)) {
        setCountryMenuOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("itrPersonal-IN", JSON.stringify(prefillPersonal));
  }, [prefillPersonal]);

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

  const autoDraftInput = useMemo<IndiaTaxInput>(() => {
    if (salary?.derivedTaxInput) return salary.derivedTaxInput;

    if (result?.country === "IN" && isIndiaInput(result.userInput)) {
      return result.userInput;
    }

    if (savedTaxInput?.input) return savedTaxInput.input;

    return DEFAULT_IN_PREFILL;
  }, [salary?.derivedTaxInput, result, savedTaxInput]);

  const downloadTextFile = (filename: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(href);
  };

  const onDownloadJson = () => {
    if (!prefillResult) return;
    const payload = {
      generatedAt: draftGeneratedAt,
      inputUsed: draftInputUsed,
      personal: prefillPersonal,
      draft: prefillResult,
    };
    downloadTextFile(
      `taxverse-itr-draft-${prefillResult.financialYear}.json`,
      `${JSON.stringify(payload, null, 2)}\n`,
    );
  };

  const onDownloadSummary = () => {
    if (!prefillResult) return;
    const lines: string[] = [];
    lines.push(`Taxverse ITR Draft Pack (${prefillResult.form})`);
    lines.push(`Financial Year: ${prefillResult.financialYear}`);
    lines.push(`Generated At: ${draftGeneratedAt ?? new Date().toISOString()}`);
    lines.push("");
    lines.push("Input Snapshot");
    lines.push(`Annual Salary: ${draftInputUsed?.annualSalary ?? autoDraftInput.annualSalary}`);
    lines.push(`Other Income: ${draftInputUsed?.otherIncome ?? autoDraftInput.otherIncome}`);
    lines.push(`Section 80C: ${draftInputUsed?.deductions80C ?? autoDraftInput.deductions80C}`);
    lines.push(`HRA: ${draftInputUsed?.hra ?? autoDraftInput.hra}`);
    lines.push(`NPS: ${draftInputUsed?.nps ?? autoDraftInput.nps}`);
    lines.push(`Home Loan Interest: ${draftInputUsed?.homeLoanInterest ?? autoDraftInput.homeLoanInterest}`);
    if (prefillPersonal.fullName) lines.push(`Name: ${prefillPersonal.fullName}`);
    if (prefillPersonal.pan) lines.push(`PAN: ${prefillPersonal.pan}`);
    if (prefillPersonal.dateOfBirth) lines.push(`DOB: ${prefillPersonal.dateOfBirth}`);
    lines.push("");
    prefillResult.sections.forEach((section) => {
      lines.push(section.name);
      section.fields.forEach((field) => {
        const value = field.value === null || field.value === "" ? "-" : String(field.value);
        lines.push(`- ${field.label}: ${value}`);
      });
      lines.push("");
    });
    if (prefillResult.notes.length) {
      lines.push("Notes");
      prefillResult.notes.forEach((note) => lines.push(`- ${note}`));
    }
    downloadTextFile(`taxverse-itr-draft-${prefillResult.financialYear}.txt`, `${lines.join("\n")}\n`);
  };

  const onOpenPrintPreview = () => {
    if (!prefillResult) return;
    const sectionsMarkup = prefillResult.sections
      .map((section) => {
        const fieldsMarkup = section.fields
          .map((field) => {
            const value = field.value === null || field.value === "" ? "-" : String(field.value);
            return `<tr><td>${field.label}</td><td>${value}</td></tr>`;
          })
          .join("");
        return `<section><h3>${section.name}</h3><table>${fieldsMarkup}</table></section>`;
      })
      .join("");

    const popup = window.open("", "_blank", "width=960,height=900");
    if (!popup) return;
    popup.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Taxverse ITR Draft</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
    h1 { margin: 0 0 8px 0; }
    h2 { margin: 0 0 20px 0; font-size: 16px; font-weight: 500; color: #334155; }
    h3 { margin: 20px 0 8px 0; font-size: 15px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    td { border: 1px solid #cbd5e1; padding: 8px; font-size: 13px; vertical-align: top; }
    td:first-child { width: 45%; color: #334155; }
    .meta { margin-bottom: 14px; font-size: 13px; color: #334155; }
    .note { margin-top: 16px; font-size: 13px; }
  </style>
</head>
<body>
  <h1>Taxverse ITR Draft Pack</h1>
  <h2>${prefillResult.form} | FY ${prefillResult.financialYear}</h2>
  <div class="meta">Generated At: ${draftGeneratedAt ?? new Date().toISOString()}</div>
  ${sectionsMarkup}
  ${
    prefillResult.notes.length
      ? `<div class="note"><strong>Notes</strong><ul>${prefillResult.notes.map((n) => `<li>${n}</li>`).join("")}</ul></div>`
      : ""
  }
</body>
</html>`);
    popup.document.close();
    popup.focus();
  };

  const onPrefill = async () => {
    setPrefillLoading(true);
    setPrefillError(null);
    try {
      const res = await prefillIndia({ input: autoDraftInput, personal: prefillPersonal });
      setPrefillResult(res);
      setDraftInputUsed(autoDraftInput);
      setDraftGeneratedAt(new Date().toISOString());
    } catch (e) {
      setPrefillError(e instanceof Error ? e.message : "Prefill failed");
    } finally {
      setPrefillLoading(false);
    }
  };

  return (
    <AuroraBackground className="min-h-screen h-auto justify-start bg-[#020617] text-white">
      <div className={`${uiTheme.page} relative w-full overflow-hidden pb-12 pt-10 text-white`}>
        <Spotlight className="-top-44 left-0" fill="rgba(14,165,233,0.25)" />
        <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#93c5fd]">
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
            <div className="inline-flex items-center gap-2 text-xs text-white/80">
              <span className="font-medium">Change country:</span>
              <div ref={countryMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setCountryMenuOpen((prev) => !prev)}
                  className="inline-flex h-10 min-w-[170px] items-center justify-between gap-2 rounded-xl border border-[#1e3a8a80] bg-[#0f172ae6] px-3 text-sm text-white shadow-[0_10px_28px_-18px_rgba(37,99,235,0.75)] transition hover:border-[#2563ebaa] hover:bg-[#13203f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/45"
                  aria-haspopup="listbox"
                  aria-expanded={countryMenuOpen}
                >
                  <span>{COUNTRY_LABEL[selectedCountry]}</span>
                  <ChevronDown
                    className={cn("h-4 w-4 text-blue-200/90 transition-transform", countryMenuOpen && "rotate-180")}
                  />
                </button>
                {countryMenuOpen ? (
                  <div
                    className="absolute left-0 top-[calc(100%+8px)] z-40 w-full overflow-hidden rounded-xl border border-[#2563eb80] bg-[#0b142be6] p-1.5 shadow-[0_22px_48px_-20px_rgba(8,47,73,0.95)] backdrop-blur-xl"
                    role="listbox"
                  >
                    {COUNTRY_OPTIONS.map((country) => {
                      const isActive = selectedCountry === country.value;
                      return (
                        <button
                          key={country.value}
                          type="button"
                          onClick={() => {
                            onCountryChange(country.value);
                            setCountryMenuOpen(false);
                          }}
                          className={cn(
                            "w-full rounded-lg px-2.5 py-2 text-left text-sm transition",
                            isActive
                              ? "bg-[#1d4ed8]/35 text-cyan-100"
                              : "text-white/90 hover:bg-[#1e3a8a4d] hover:text-cyan-100",
                          )}
                          role="option"
                          aria-selected={isActive}
                        >
                          {country.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
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
                ITR Draft Pack (India)
              </div>
              <p className={`text-sm ${uiTheme.textMuted}`}>
                Uses your existing salary and analysis data to generate an ITR-1 style draft you can preview and download.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-white/65">Annual Salary</div>
                  <div className="mt-1 text-sm font-semibold text-white">{autoDraftInput.annualSalary.toLocaleString("en-IN")}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-white/65">Other Income</div>
                  <div className="mt-1 text-sm font-semibold text-white">{autoDraftInput.otherIncome.toLocaleString("en-IN")}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-white/65">Section 80C</div>
                  <div className="mt-1 text-sm font-semibold text-white">{autoDraftInput.deductions80C.toLocaleString("en-IN")}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-white/65">HRA</div>
                  <div className="mt-1 text-sm font-semibold text-white">{autoDraftInput.hra.toLocaleString("en-IN")}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-white/65">NPS</div>
                  <div className="mt-1 text-sm font-semibold text-white">{autoDraftInput.nps.toLocaleString("en-IN")}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-white/65">Home Loan Interest</div>
                  <div className="mt-1 text-sm font-semibold text-white">{autoDraftInput.homeLoanInterest.toLocaleString("en-IN")}</div>
                </div>
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
                  {prefillLoading ? "Generating..." : "Generate Draft Pack"}
                </button>
                {prefillError ? <div className="text-sm text-rose-300">{prefillError}</div> : null}
              </div>

              {prefillResult ? (
                <div className="mt-6 grid gap-4">
                  <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/5 p-4 text-xs text-cyan-100/85">
                    <div>Form: {prefillResult.form}</div>
                    <div className="mt-1">Financial Year: {prefillResult.financialYear}</div>
                    {draftGeneratedAt ? <div className="mt-1">Generated: {new Date(draftGeneratedAt).toLocaleString()}</div> : null}
                  </div>
                  {prefillResult.sections.map((section) => (
                    <div key={section.name} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                      <div className="mb-3 text-sm font-semibold text-white">{section.name}</div>
                      <div className="grid gap-2 md:grid-cols-2">
                        {section.fields.map((field) => (
                          <div key={field.key} className="flex items-center justify-between gap-3 text-sm">
                            <span className={uiTheme.textMuted}>{field.label}</span>
                            <span className="font-semibold text-white">
                              {field.value !== null && field.value !== "" ? field.value : "-"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {prefillResult.notes.length ? (
                    <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                      <div className="mb-2 text-sm font-semibold text-white">Important Notes</div>
                      <ul className={`space-y-2 text-sm ${uiTheme.textMuted}`}>
                        {prefillResult.notes.map((note) => (
                          <li key={note} className="flex gap-2">
                            <span className="text-white/56">-</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={onDownloadJson}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download JSON
                    </button>
                    <button
                      type="button"
                      onClick={onDownloadSummary}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Download Summary
                    </button>
                    <button
                      type="button"
                      onClick={onOpenPrintPreview}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print / Save PDF
                    </button>
                  </div>
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
    </AuroraBackground>
  );
}
