"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Home, BarChart3, Lightbulb, MessageCircle, Wallet, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { uiTheme } from "@/lib/uiTheme";

export function Navigation() {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  const links = [
    { href: "/", label: "Home", Icon: Home },
    { href: "/salary", label: "Salary", Icon: Wallet },
    { href: "/results", label: "Results", Icon: BarChart3 },
    { href: "/insights", label: "Insights", Icon: Lightbulb },
    { href: "/qa", label: "Q&A", Icon: MessageCircle },
    { href: "/itr-guide", label: "ITR Guide", Icon: FileText },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-cyan-300/20 bg-[linear-gradient(180deg,rgba(2,6,23,0.92)_0%,rgba(3,15,40,0.86)_100%)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <Link href="/" className="flex items-center gap-2 group">
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent transition-all duration-300 group-hover:brightness-125">
                Taxverse
              </div>
            </Link>
          </motion.div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link, index) => {
              const Icon = link.Icon;
              return (
                <motion.div
                  key={link.href}
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.34, delay: 0.04 * index }}
                  whileHover={shouldReduceMotion ? undefined : { y: -1.5, scale: 1.02 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      "group relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                      "hover:bg-cyan-400/10",
                      pathname === link.href
                        ? uiTheme.navActive
                        : "text-white/75 hover:text-white"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                    {pathname !== link.href ? (
                      <span className="absolute inset-x-3 bottom-1 h-px origin-left scale-x-0 bg-cyan-300/80 transition-transform duration-300 group-hover:scale-x-100" />
                    ) : null}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <div className="text-xs text-white/50">Menu</div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden grid grid-cols-6 gap-1 pb-2">
          {links.map((link) => {
            const Icon = link.Icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-2 py-2 rounded text-xs text-center font-medium transition-all flex justify-center",
                  pathname === link.href
                    ? uiTheme.navActive
                    : "text-white/65 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
