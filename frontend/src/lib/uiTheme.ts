export const uiTheme = {
  page:
    "min-h-screen bg-[radial-gradient(1200px_500px_at_10%_-10%,rgba(14,165,233,0.16),transparent),radial-gradient(1000px_480px_at_90%_0%,rgba(56,189,248,0.12),transparent),linear-gradient(180deg,#020617_0%,#020617_45%,#000000_100%)]",
  panel: "border border-white/20 bg-slate-900/72 shadow-[0_12px_48px_rgba(14,165,233,0.08)] backdrop-blur-sm",
  panelSoft: "border border-white/15 bg-slate-900/58 backdrop-blur-sm",
  field:
    "border border-white/20 bg-slate-800/70 text-white placeholder:text-white/55 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sky-300/40 focus-visible:border-sky-300/40",
  textBody: "text-white/82",
  textMuted: "text-white/72",
  textSubtle: "text-white/62",
  cta:
    "bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-white shadow-[0_12px_36px_rgba(14,165,233,0.35)] transition hover:shadow-[0_16px_48px_rgba(14,165,233,0.45)] disabled:opacity-50 disabled:pointer-events-none",
  navActive:
    "bg-gradient-to-r from-cyan-500/30 via-sky-500/30 to-blue-600/30 text-white border border-sky-300/40 shadow-[0_8px_30px_rgba(14,165,233,0.2)]",
} as const;
