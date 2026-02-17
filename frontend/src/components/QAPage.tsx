"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import type { AnalyzeResponse, QaMessage, SalaryResult } from "@/lib/types";
import { askQuestion } from "@/lib/api";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { NoiseBackground } from "@/components/ui/noise-background";
import { cn } from "@/lib/utils";
import { MessageCircle, AlertCircle, Lightbulb, HelpCircle } from "lucide-react";
import { motion } from "motion/react";
import { AuroraBackground } from "@/components/ui/aurora-background";

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

export function QAPage() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [salary, setSalary] = useState<SalaryResult | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<QaMessage[]>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const countries: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (!key) continue;
        const m = key.match(/^taxResult-(.+)$/);
        if (m) countries.push(m[1]);
      }
      const deduped = Array.from(new Set(countries));
      setAvailableCountries(deduped);

      const pick = deduped.includes("IN") ? "IN" : deduped[0] ?? null;
      const loadFor = pick ?? "default";

      const payload =
        loadFor === "default"
          ? sessionStorage.getItem("taxResult")
          : sessionStorage.getItem(`taxResult-${loadFor}`);
      if (payload) setResult(JSON.parse(payload));

      const storedSalary = sessionStorage.getItem("salaryResult");
      if (storedSalary) setSalary(JSON.parse(storedSalary));

      setCountry(loadFor === "default" ? null : loadFor);
      setLoading(false);
    }
  }, []);

  const onSelectCountry = (value: string) => {
    const payload = sessionStorage.getItem(value === "default" ? "taxResult" : `taxResult-${value}`);
    if (payload) {
      setCountry(value === "default" ? null : value);
      setResult(JSON.parse(payload));
      setMessages([]);
      setFollowUps([]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, qaLoading]);

  const suggestedFollowUps = useMemo(() => {
    if (!result?.report) return [];
    const rec = result.report.options.find((o) => o.id === result.report.recommendedOptionId)?.name ?? "the recommended option";
    const items = [
      "Top 3 actions to save more tax",
      `Why is ${rec} better for me?`,
      "What happens if my income rises 10%?",
      salary?.tdsPlan ? "How much TDS per month now?" : null,
      salary?.input?.npsAnnual !== undefined ? "Should I add more to NPS or 80C?" : null,
    ].filter(Boolean) as string[];
    return items.slice(0, 4);
  }, [result?.report, salary]);

  const onAsk = async (q?: string) => {
    const text = (q ?? question).trim();
    if (!text) return;
    if (!result) {
      setQaError("Please run the calculator first.");
      return;
    }

    setQaLoading(true);
    setQaError(null);

    const contextForQa = {
      executiveSummary: result.executiveSummary,
      report: result.report,
      projection: result.projection,
      insights: result.insights,
      aiAnalysis: result.aiAnalysis,
      salary: salary
        ? {
            input: salary.input,
            breakdown: salary.breakdown,
            tdsPlan: salary.tdsPlan,
            derivedTaxInput: salary.derivedTaxInput,
          }
        : undefined,
    };

    const nextMessages: QaMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setQuestion("");

    try {
      const r = await askQuestion({
        context: contextForQa,
        question: text,
        history: nextMessages,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: r.answer }]);
      const merged = r.followUps?.length ? r.followUps : suggestedFollowUps;
      setFollowUps(merged);
    } catch (e) {
      setQaError(e instanceof Error ? e.message : "Unknown Q&A error");
    } finally {
      setQaLoading(false);
    }
  };

  if (loading) {
    return (
      <AuroraBackground className="min-h-screen h-auto justify-center bg-zinc-950 text-white dark:bg-zinc-950">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="relative z-10 text-white/70"
        >
          Loading...
        </motion.div>
      </AuroraBackground>
    );
  }

  if (!result) {
    return (
      <AuroraBackground className="min-h-screen h-auto justify-start bg-zinc-950 text-white dark:bg-zinc-950">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8, ease: "easeInOut" }}
          className="relative z-10 mx-auto w-full max-w-4xl px-4 py-16 text-center"
        >
          <div className="text-3xl md:text-6xl font-bold text-white">
            No analysis to query
          </div>
          <div className="mt-4 font-extralight text-base md:text-2xl text-white/70">
            Run the calculator first, then ask questions about your results.
          </div>
          <div className="mt-8 flex justify-center">
            <NoiseButton onClick={() => (window.location.href = "/salary")}>Analyze salary</NoiseButton>
          </div>
        </motion.div>
      </AuroraBackground>
    );
  }

  const report = result.report;

  return (
    <AuroraBackground className="min-h-screen h-auto justify-start bg-zinc-950 text-white dark:bg-zinc-950">
      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Ask Questions</h1>
          <p className="text-white/70">
            Ask follow-ups about your result. Answers are grounded in your computed analysis.
          </p>
          {availableCountries.length > 1 ? (
            <div className="mt-3 text-xs text-white/60">
              Context:
              <select
                value={country ?? "default"}
                onChange={(e) => onSelectCountry(e.target.value)}
                className="ml-2 inline-block h-8 rounded-md border border-white/20 bg-white/5 px-2 text-xs text-white outline-none focus:ring-2 focus:ring-white/20"
              >
                <option value="default">Most recent</option>
                {availableCountries.map((c) => (
                  <option key={c} value={c}>
                    {c === "IN" ? "India" : c === "US" ? "United States" : c}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {report?.recommendedOptionId ? (
            <div className="mt-3 text-xs text-white/60">
              Context loaded • Recommended:{" "}
              <span className="text-white">
                {report.options.find((o) => o.id === report.recommendedOptionId)?.name ??
                  report.recommendedOptionId}
              </span>
            </div>
          ) : null}
        </motion.div>

        {/* Main Chat */}
        <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-8" radius={420}>
          <div className="relative z-10 flex flex-col h-[600px]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-auto mb-4 pr-2">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <div className="text-5xl"><MessageCircle className="w-16 h-16 text-violet-400" /></div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Ask About Your Analysis</h3>
                    <p className="text-sm text-white/60 max-w-md">
                      Try questions like:
                    </p>
                    <ul className="text-sm text-white/60 mt-3 space-y-1">
                      <li>• "Why is this regime better?"</li>
                      <li>• "What if my salary increases to ₹15 lakhs?"</li>
                      <li>• "How can I maximize my deductions?"</li>
                      <li>• "When should I switch regimes?"</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex gap-3",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          AI
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-3 text-sm",
                          msg.role === "user"
                            ? "bg-cyan-500 text-white"
                            : "bg-white/10 text-white/90 border border-white/20"
                        )}
                      >
                        {msg.content}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          U
                        </div>
                      )}
                    </div>
                  ))}

                  {qaLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        AI
                      </div>
                      <div className="bg-white/10 text-white/90 border border-white/20 rounded-2xl px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
                          <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: "0.2s" }} />
                          <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: "0.4s" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Follow-up Suggestions */}
            {followUps.length > 0 && !qaLoading && (
              <div className="mb-4 pb-4 border-t border-white/10">
                <div className="text-xs text-white/50 mb-2">Suggested follow-ups:</div>
                <div className="flex flex-wrap gap-2">
                  {followUps.map((followUp) => (
                    <button
                      key={followUp}
                      onClick={() => onAsk(followUp)}
                      className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors border border-white/10"
                    >
                      {followUp}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {qaError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs">
                {qaError}
              </div>
            )}

            {/* Input Area */}
            <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !qaLoading) {
                      onAsk();
                    }
                  }}
                  placeholder="Ask anything about your tax analysis..."
                  className="flex-1 h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/20"
                  disabled={qaLoading}
                />
                <NoiseButton onClick={() => onAsk()} disabled={qaLoading || !question.trim()}>
                  {qaLoading ? "..." : "Send"}
                </NoiseButton>
              </div>
              <div className="text-xs text-white/40">
                Press Enter or click Send • AI answers are grounded in your analysis
              </div>
            </div>
          </div>
        </CardSpotlight>

        {/* Quick Tips */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-6" radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 font-semibold mb-3">
                <Lightbulb className="w-5 h-5" />
                Tips for Better Answers
              </h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li>• Be specific with numbers</li>
                <li>• Ask about your situation</li>
                <li>• Ask "what-if" scenarios</li>
                <li>• Request explanations</li>
              </ul>
            </div>
          </CardSpotlight>

          <CardSpotlight className="rounded-2xl border-white/10 bg-black/40 p-6" radius={420}>
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 font-semibold mb-3">
                <HelpCircle className="w-5 h-5" />
                Example Questions
              </h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li>• "Why is this regime better?"</li>
                <li>• "What are my top deductions?"</li>
                <li>• "When should I switch?"</li>
                <li>• "How to maximize savings?"</li>
              </ul>
            </div>
          </CardSpotlight>
        </div>
      </div>
    </AuroraBackground>
  );
}
