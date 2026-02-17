"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calculator, BarChart3, Lightbulb, MessageCircle, Wallet, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home", Icon: Home },
    { href: "/salary", label: "Salary", Icon: Wallet },
    { href: "/calculator", label: "Calculator", Icon: Calculator },
    { href: "/results", label: "Results", Icon: BarChart3 },
    { href: "/insights", label: "Insights", Icon: Lightbulb },
    { href: "/qa", label: "Q&A", Icon: MessageCircle },
    { href: "/itr-guide", label: "ITR Guide", Icon: FileText },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Taxverse
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.Icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                    "hover:bg-white/10",
                    pathname === link.href
                      ? "bg-gradient-to-r from-sky-400/20 via-violet-400/20 to-fuchsia-400/20 text-white border border-white/20"
                      : "text-white/70 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <div className="text-xs text-white/50">Menu</div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden grid grid-cols-7 gap-1 pb-2">
          {links.map((link) => {
            const Icon = link.Icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-2 py-2 rounded text-xs text-center font-medium transition-all flex justify-center",
                  pathname === link.href
                    ? "bg-gradient-to-r from-sky-400/20 via-violet-400/20 to-fuchsia-400/20 text-white"
                    : "text-white/60 hover:text-white"
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
