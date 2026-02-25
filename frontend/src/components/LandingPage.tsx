"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Globe } from "@/components/magicui/globe";
import { Zap, TrendingUp, Cpu, Target, BarChart3 } from "lucide-react";

const COUNTRIES = [
  { code: "IN", label: "India", lat: 20.5937, lon: 78.9629 },
  { code: "US", label: "United States", lat: 39.8283, lon: -98.5795 },
  { code: "UK", label: "United Kingdom", lat: 54.5, lon: -2.5 },
  { code: "SG", label: "Singapore", lat: 1.3521, lon: 103.8198 },
  { code: "AE", label: "UAE", lat: 24.4539, lon: 54.3773 },
] as const;

function CTAButton(props: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-[#0f172a] bg-[#38bdf8] hover:bg-[#0ea5e9] transition";
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

      const lonShifted = lon - phi;
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
      iconClass: "text-blue-400",
    },
    {
      title: "AI-Powered",
      subtitle: "Smart Explanations",
      Icon: Cpu,
      iconClass: "text-blue-300",
    },
    {
      title: "File Better",
      subtitle: "Actionable Next Steps",
      Icon: TrendingUp,
      iconClass: "text-blue-200",
    },
  ] as const;

  const whyCards = [
    {
      title: "Precise Recommendations",
      text: "Get clear recommendations based on your salary, deductions, and investments.",
      Icon: Target,
      iconClass: "text-blue-400",
    },
    {
      title: "Long-term Projections",
      text: "See if your recommendation still makes sense when your income grows in future years.",
      Icon: TrendingUp,
      iconClass: "text-blue-300",
    },
    {
      title: "AI Insights",
      text: "Ask follow-up questions and get plain-language explanations based on your own numbers.",
      Icon: Cpu,
      iconClass: "text-blue-200",
    },
    {
      title: "Action Plans",
      text: "Get a simple action list showing where extra investment can lower your tax the most.",
      Icon: Zap,
      iconClass: "text-blue-100",
    },
  ] as const;

  const stepCards = [
    {
      step: "Step 1",
      title: "Add your details",
      text: "Upload salary slip for India or enter income for other countries.",
      borderClass: "border-blue-300/20",
      stepClass: "text-blue-200/80",
    },
    {
      step: "Step 2",
      title: "Compare outcomes",
      text: "Review tax options, projections, and what-if scenarios in one place.",
      borderClass: "border-blue-300/20",
      stepClass: "text-blue-200/80",
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
    <AuroraBackground className="min-h-screen h-auto justify-start bg-[#020617] text-white">
      <div className="relative z-10 w-full">
        <div className="mx-auto w-full max-w-6xl px-4 pt-0">
          <div className="grid min-h-[72vh] items-center gap-12 lg:grid-cols-2">
            <motion.div
              className="flex flex-col justify-center"
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 30 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: introDelay }}
            >
              <motion.h1
                className="mb-4 text-5xl font-bold tracking-tight md:text-6xl"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 14 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: introDelay + 0.1 }}
              >
                Taxverse
              </motion.h1>
              <motion.p
                className="mb-2 text-lg font-semibold text-[#93c5fd]"
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
                Make smarter tax moves with real clarity.
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
                    className="rounded-lg border border-[#1E3A8A66] bg-[#0F172A] p-4 transition-colors duration-300 hover:border-[#2563EB99] hover:bg-[#111C34]"
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
                  : { opacity: 0.8, scale: 1.55, x: -120, y: -18, filter: "blur(4px)" }
              }
              animate={
                shouldReduceMotion
                  ? undefined
                  : { opacity: 1, scale: 1, x: 0, y: 0, filter: "blur(0px)" }
              }
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            >
              <motion.div
                className="relative mx-auto aspect-square w-full max-w-[520px] transform-gpu"
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: [0, -7, 0, 6, 0],
                        rotate: [0, 0.9, 0, -0.9, 0],
                      }
                }
                transition={{
                  duration: 9.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <motion.div
                  className="absolute inset-0"
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : { x: [0, 6, 0, -5, 0], y: [0, -4, 0, 4, 0] }
                  }
                  transition={{ duration: 10.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={shouldReduceMotion ? undefined : { opacity: [0.32, 0.48, 0.32], scale: [0.98, 1.02, 0.98] }}
                    transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      boxShadow: "0 0 88px rgba(37, 99, 235, 0.2)",
                    }}
                  />
                  <Globe
                    className="inset-0 h-full w-full"
                    initialPhi={-1.72}
                    onRenderFrame={onGlobeFrame}
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
                        <span className="absolute left-1/2 top-[-16px] z-30 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#2563EB88] bg-[#0F172A] px-2.5 py-1 text-[11px] font-medium text-[#bfdbfe] opacity-100 shadow-lg backdrop-blur-sm transition-colors group-hover:border-[#60a5facc] group-hover:text-[#dbeafe]">
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
              className="rounded-2xl border border-[#1E3A8A66] bg-[#0F172A] p-8 transition-colors duration-300 hover:border-[#2563EB99] hover:bg-[#111C34]"
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
              className={`rounded-2xl border ${card.borderClass} bg-[#0F172A] p-5`}
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
    </AuroraBackground>
  );
}
