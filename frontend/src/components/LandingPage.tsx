"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Globe } from "@/components/magicui/globe";
import { Spotlight } from "@/components/ui/spotlight";
import { Zap, TrendingUp, Cpu, Target, BarChart3 } from "lucide-react";

const COUNTRIES = [
  { code: "IN", label: "India", lat: 20.5937, lon: 78.9629 },
  { code: "US", label: "United States", lat: 38.9072, lon: -77.0369 },
  { code: "UK", label: "United Kingdom", lat: 51.5072, lon: -0.1276 },
  { code: "SG", label: "Singapore", lat: 1.3521, lon: 103.8198 },
  { code: "AE", label: "UAE", lat: 25.2048, lon: 55.2708 },
] as const;

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
  const shouldReduceMotion = useReducedMotion();
  const introDelay = shouldReduceMotion ? 0 : 1.05;
  const [frame, setFrame] = useState({ phi: 0, theta: 0.3, size: 0 });
  const lastUpdateRef = useRef(0);

  const onGlobeFrame = useCallback((next: { phi: number; theta: number; size: number }) => {
    const now = performance.now();
    if (now - lastUpdateRef.current < 28) return;
    lastUpdateRef.current = now;
    setFrame(next);
  }, []);

  const projectedPins = useMemo(() => {
    const { phi, theta, size } = frame;
    if (!size) return [];

    const toRad = (d: number) => (d * Math.PI) / 180;

    return COUNTRIES.map((country, index) => {
      const lat = toRad(country.lat);
      const lon = toRad(country.lon);

      const lonShifted = lon + phi;
      const cosLat = Math.cos(lat);
      const sinLat = Math.sin(lat);
      const cosLon = Math.cos(lonShifted);
      const sinLon = Math.sin(lonShifted);

      const x = cosLat * sinLon;
      const y = sinLat * Math.cos(theta) - cosLat * cosLon * Math.sin(theta);
      const z = sinLat * Math.sin(theta) + cosLat * cosLon * Math.cos(theta);
      const floatOffset = shouldReduceMotion ? 0 : Math.sin(phi * 5 + index * 1.3) * 5;

      const radius = size * 0.41;
      const left = size / 2 + x * radius;
      const top = size / 2 - y * radius + floatOffset;
      const visible = z > 0;

      return {
        ...country,
        index,
        visible,
        left,
        top,
      };
    });
  }, [frame, shouldReduceMotion]);

  const heroCards = [
    {
      title: "Compare",
      subtitle: "Country Tax Options",
      Icon: BarChart3,
      iconClass: "text-cyan-400",
    },
    {
      title: "AI-Powered",
      subtitle: "Smart Explanations",
      Icon: Cpu,
      iconClass: "text-violet-400",
    },
    {
      title: "File Better",
      subtitle: "Actionable Next Steps",
      Icon: TrendingUp,
      iconClass: "text-fuchsia-400",
    },
  ] as const;

  const whyCards = [
    {
      title: "Precise Recommendations",
      text: "Get clear recommendations based on your salary, deductions, and investments.",
      Icon: Target,
      iconClass: "text-cyan-400",
    },
    {
      title: "Long-term Projections",
      text: "See if your recommendation still makes sense when your income grows in future years.",
      Icon: TrendingUp,
      iconClass: "text-violet-400",
    },
    {
      title: "AI Insights",
      text: "Ask follow-up questions and get plain-language explanations based on your own numbers.",
      Icon: Cpu,
      iconClass: "text-fuchsia-400",
    },
    {
      title: "Action Plans",
      text: "Get a simple action list showing where extra investment can lower your tax the most.",
      Icon: Zap,
      iconClass: "text-amber-400",
    },
  ] as const;

  const stepCards = [
    {
      step: "Step 1",
      title: "Add your details",
      text: "Upload salary slip for India or enter income for other countries.",
      borderClass: "border-cyan-300/20",
      stepClass: "text-cyan-200/80",
    },
    {
      step: "Step 2",
      title: "Compare outcomes",
      text: "Review tax options, projections, and what-if scenarios in one place.",
      borderClass: "border-sky-300/20",
      stepClass: "text-sky-200/80",
    },
    {
      step: "Step 3",
      title: "Take action",
      text: "Use clear next-step suggestions and ask follow-up questions in Q&A.",
      borderClass: "border-blue-300/20",
      stepClass: "text-blue-200/80",
    },
  ] as const;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <AuroraBackground className="h-screen justify-center bg-zinc-950 text-white dark:bg-zinc-950 dark:text-white">
        <Spotlight className="-top-40 left-0" fill="rgba(56, 189, 248, 0.35)" />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          animate={
            shouldReduceMotion
              ? undefined
              : { backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }
          }
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 22%, rgba(56,189,248,0.16), transparent 36%), radial-gradient(circle at 82% 28%, rgba(59,130,246,0.13), transparent 40%), radial-gradient(circle at 50% 84%, rgba(14,165,233,0.11), transparent 38%)",
            backgroundSize: "180% 180%",
          }}
        />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
          <div className="grid h-full items-center gap-12 lg:grid-cols-2">
            <motion.div
              className="flex flex-col justify-center"
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 30 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: introDelay }}
            >
              <motion.div
                className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-slate-800/70 px-3 py-1 text-xs text-white/88"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: introDelay + 0.05 }}
              >
                Global Tax Decision Intelligence
              </motion.div>
              <motion.h1
                className="mb-4 text-5xl font-bold tracking-tight md:text-6xl"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 14 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: introDelay + 0.1 }}
              >
                Taxverse
              </motion.h1>
              <motion.p
                className="mb-2 bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-lg font-semibold text-transparent text-white/88"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 14 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: introDelay + 0.16 }}
              >
                Clarity for Complex Tax Systems
              </motion.p>
              <motion.p
                className="mb-8 max-w-xl text-base text-white/72"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: introDelay + 0.22 }}
              >
                Analyze taxes across countries, understand how your numbers are calculated, and explore future scenarios. Built for accuracy, designed for clarity.
              </motion.p>

              <motion.div
                className="flex flex-col items-start gap-4 sm:flex-row"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: introDelay + 0.32 }}
              >
                <CTAButton href="/salary" className="w-full sm:w-auto">
                  Analyze Salary Slip
                </CTAButton>
              </motion.div>

              <div className="mt-12 grid grid-cols-3 gap-4 text-sm">
                {heroCards.map((card, index) => (
                  <motion.div
                    key={card.title}
                    className="rounded-lg border border-white/20 bg-slate-800/70 p-4 transition-colors duration-300 hover:border-cyan-200/45 hover:bg-slate-800/85"
                    initial={shouldReduceMotion ? undefined : { opacity: 0, y: 26 }}
                    animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: introDelay + 0.38 + index * 0.1 }}
                    whileHover={shouldReduceMotion ? undefined : { y: -5, scale: 1.02 }}
                  >
                    <div className="mb-2 flex justify-center">
                      <card.Icon className={`h-6 w-6 ${card.iconClass}`} />
                    </div>
                    <div className="font-semibold text-white/90">{card.title}</div>
                    <div className="mt-1 text-xs text-white/72">{card.subtitle}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="hidden items-center justify-center lg:flex"
              initial={
                shouldReduceMotion
                  ? undefined
                  : { opacity: 0.8, scale: 1.85, x: -250, y: -28, rotate: -18, filter: "blur(6px)" }
              }
              animate={
                shouldReduceMotion
                  ? undefined
                  : { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0, filter: "blur(0px)" }
              }
              transition={{ duration: 1.9, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            >
              <motion.div
                className="relative mx-auto aspect-square w-full max-w-[520px] transform-gpu"
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        rotate: [0, 130, 250, 330, 360],
                      }
                }
                transition={{
                  rotate: { duration: 1.9, ease: [0.19, 1, 0.22, 1], delay: 0.02 },
                }}
              >
                <motion.div
                  className="absolute inset-0"
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : { x: [0, 10, 0, -9, 0], y: [0, -8, 0, 7, 0], rotate: [0, 1.7, 0, -1.6, 0] }
                  }
                  transition={{ duration: 8.4, repeat: Infinity, ease: "easeInOut", delay: 1.85 }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={shouldReduceMotion ? undefined : { opacity: [0.32, 0.48, 0.32], scale: [0.98, 1.02, 0.98] }}
                    transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      boxShadow: "0 0 100px rgba(148, 223, 255, 0.22)",
                    }}
                  />
                  <Globe className="inset-0 h-full w-full" onRenderFrame={onGlobeFrame} />
                  <motion.div
                    className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.22),rgba(2,6,23,0)_62%)]"
                    animate={shouldReduceMotion ? undefined : { opacity: [0.4, 0.65, 0.4] }}
                    transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {projectedPins.map((country) => (
                    <motion.div
                      key={country.code}
                      className="absolute -translate-x-1/2 -translate-y-1/2 transition-opacity"
                      style={{
                        left: `${country.left}px`,
                        top: `${country.top}px`,
                        opacity: country.visible ? 1 : 0,
                        pointerEvents: country.visible ? "auto" : "none",
                      }}
                      animate={
                        shouldReduceMotion
                          ? undefined
                          : { scale: [1, 1.035, 1], y: [0, -2, 0] }
                      }
                      transition={{
                        duration: 3.2,
                        delay: country.index * 0.25,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Link
                        href={`/salary?country=${country.code}`}
                        className="group absolute left-0 top-0 block"
                      >
                        <span className="absolute left-1/2 top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400/30 blur-[0.5px] group-hover:bg-orange-300/45" />
                        <span className="absolute left-1/2 top-1/2 z-20 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/80 bg-orange-900/95 shadow-[0_0_8px_rgba(194,65,12,0.45)]" />
                        <span className="absolute left-1/2 top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-300/55 opacity-70 group-hover:opacity-100 group-hover:animate-ping motion-reduce:animate-none" />
                        <span className="absolute left-1/2 top-[-16px] z-30 -translate-x-1/2 whitespace-nowrap rounded-full border border-cyan-300/35 bg-slate-900/82 px-2.5 py-1 text-[11px] font-medium text-cyan-100 opacity-100 shadow-lg backdrop-blur-sm transition-colors group-hover:border-cyan-200/60 group-hover:text-cyan-50">
                          {country.label}
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </AuroraBackground>

      <div className="mx-auto max-w-6xl px-4 py-20">
        <motion.h2
          className="mb-12 text-center text-3xl font-bold"
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.5 }}
        >
          Why Taxverse?
        </motion.h2>
        <div className="grid gap-8 md:grid-cols-2">
          {whyCards.map((card, index) => (
            <motion.div
              key={card.title}
              className="rounded-2xl border border-white/20 bg-slate-800/70 p-8 transition-colors duration-300 hover:border-cyan-200/35 hover:bg-slate-800/85"
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 22 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.48, delay: index * 0.08 }}
              whileHover={shouldReduceMotion ? undefined : { y: -4 }}
            >
              <div className="mb-4 flex items-center gap-3">
                <card.Icon className={`h-8 w-8 ${card.iconClass}`} />
                <h3 className="text-xl font-semibold">{card.title}</h3>
              </div>
              <p className="text-white/78">{card.text}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <motion.h3
          className="mb-6 text-xl font-semibold text-white/90"
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-12%" }}
          transition={{ duration: 0.48 }}
        >
          How It Works
        </motion.h3>
        <div className="grid gap-4 md:grid-cols-3">
          {stepCards.map((card, index) => (
            <motion.div
              key={card.step}
              className={`rounded-2xl border ${card.borderClass} bg-slate-900/60 p-5`}
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.42, delay: index * 0.08 }}
            >
              <div className={`mb-2 text-xs uppercase tracking-[0.2em] ${card.stepClass}`}>{card.step}</div>
              <div className="font-semibold">{card.title}</div>
              <div className="mt-1 text-sm text-white/72">{card.text}</div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}
