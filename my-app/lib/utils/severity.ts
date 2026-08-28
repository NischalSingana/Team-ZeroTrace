import type { Severity } from "../types";

export interface SeverityConfig {
  label: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  ring: string;
  // Inline styles for cases where Tailwind JIT doesn't work
  color: string;
  mutedBg: string;
}

export const SEVERITY_CONFIG: Record<Severity, SeverityConfig> = {
  critical: {
    label: "CRITICAL",
    textClass: "text-[#fca5a5]",
    bgClass: "bg-[#450a0a]",
    borderClass: "border-[#ef4444]",
    dotColor: "#ef4444",
    badgeBg: "bg-[#450a0a]",
    badgeText: "text-[#fca5a5]",
    ring: "ring-[#ef4444]/30",
    color: "#ef4444",
    mutedBg: "#450a0a",
  },
  high: {
    label: "HIGH",
    textClass: "text-[#fdba74]",
    bgClass: "bg-[#431407]",
    borderClass: "border-[#f97316]",
    dotColor: "#f97316",
    badgeBg: "bg-[#431407]",
    badgeText: "text-[#fdba74]",
    ring: "ring-[#f97316]/30",
    color: "#f97316",
    mutedBg: "#431407",
  },
  medium: {
    label: "MEDIUM",
    textClass: "text-[#fde68a]",
    bgClass: "bg-[#3a2f00]",
    borderClass: "border-[#eab308]",
    dotColor: "#eab308",
    badgeBg: "bg-[#3a2f00]",
    badgeText: "text-[#fde68a]",
    ring: "ring-[#eab308]/30",
    color: "#eab308",
    mutedBg: "#3a2f00",
  },
  low: {
    label: "LOW",
    textClass: "text-[#86efac]",
    bgClass: "bg-[#052e16]",
    borderClass: "border-[#22c55e]",
    dotColor: "#22c55e",
    badgeBg: "bg-[#052e16]",
    badgeText: "text-[#86efac]",
    ring: "ring-[#22c55e]/30",
    color: "#22c55e",
    mutedBg: "#052e16",
  },
  info: {
    label: "INFO",
    textClass: "text-[#67e8f9]",
    bgClass: "bg-[#083344]",
    borderClass: "border-[#06b6d4]",
    dotColor: "#06b6d4",
    badgeBg: "bg-[#083344]",
    badgeText: "text-[#67e8f9]",
    ring: "ring-[#06b6d4]/30",
    color: "#06b6d4",
    mutedBg: "#083344",
  },
  unknown: {
    label: "UNKNOWN",
    textClass: "text-[#9ca3af]",
    bgClass: "bg-[#111827]",
    borderClass: "border-[#6b7280]",
    dotColor: "#6b7280",
    badgeBg: "bg-[#111827]",
    badgeText: "text-[#9ca3af]",
    ring: "ring-[#6b7280]/30",
    color: "#6b7280",
    mutedBg: "#111827",
  },
};

export function getSeverityConfig(severity: Severity): SeverityConfig {
  return SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.unknown;
}

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
  unknown: 5,
};

export function compareSeverity(a: Severity, b: Severity): number {
  return SEVERITY_ORDER[a] - SEVERITY_ORDER[b];
}
