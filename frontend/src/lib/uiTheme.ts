export const uiTheme = {
  page:
    "min-h-screen bg-[#020617]",
  panel: "border border-[#1e3a8a66] bg-[#0f172aee] shadow-[0_10px_30px_rgba(15,23,42,0.45)] backdrop-blur-sm",
  panelSoft: "border border-[#1e3a8a55] bg-[#0f172acc] backdrop-blur-sm",
  field:
    "border border-[#1e3a8a80] bg-[#0f172a] text-white placeholder:text-white/55 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#2563eb66] focus-visible:border-[#2563eb99] taxverse-select",
  textBody: "text-white/82",
  textMuted: "text-white/72",
  textSubtle: "text-white/62",
  cta:
    "bg-[#38bdf8] text-[#0f172a] transition hover:bg-[#0ea5e9] disabled:opacity-50 disabled:pointer-events-none",
  navActive:
    "bg-[#1e3a8a99] text-white border border-[#2563eb99] shadow-[0_8px_24px_rgba(37,99,235,0.25)]",
} as const;
