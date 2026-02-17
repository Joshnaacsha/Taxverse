"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, Lightbulb, MessageCircle, Wallet, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { uiTheme } from "@/lib/uiTheme";

export function Navigation() {
  const pathname = usePathname();

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
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                    "hover:bg-cyan-400/10",
                    pathname === link.href
                      ? uiTheme.navActive
                      : "text-white/75 hover:text-white"
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
