import { formatDistanceToNow, format, parseISO } from "date-fns";

// ── Timestamp formatting ─────────────────────────────────────────

export function formatRelative(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function formatAbsolute(iso: string): string {
  try {
    return format(parseISO(iso), "yyyy-MM-dd HH:mm:ss");
  } catch {
    return iso;
  }
}

export function formatAbsoluteShort(iso: string): string {
  try {
    return format(parseISO(iso), "MM-dd HH:mm:ss.SSS");
  } catch {
    return iso;
  }
}

export function formatISO(iso: string): string {
  try {
    return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
  } catch {
    return iso;
  }
}

// ── Number formatting ────────────────────────────────────────────

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatExact(n: number): string {
  return n.toLocaleString();
}

// ── Bytes formatting ─────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${bytes} B`;
}

// ── Percentage formatting ────────────────────────────────────────

export function formatPercent(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

export function formatPercentRaw(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

// ── Duration formatting ──────────────────────────────────────────

export function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// ── Delta formatting ─────────────────────────────────────────────

export function formatDelta(delta: number): string {
  const abs = Math.abs(delta);
  const prefix = delta >= 0 ? "+" : "−";
  return `${prefix}${abs.toFixed(1)}%`;
}

export function deltaDirection(delta: number): "up" | "down" | "flat" {
  if (delta > 0.5) return "up";
  if (delta < -0.5) return "down";
  return "flat";
}

// ── Rate formatting ──────────────────────────────────────────────

export function formatRate(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M/s`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K/s`;
  return `${n.toFixed(0)}/s`;
}

// ── Confidence formatting ────────────────────────────────────────

export function formatConfidence(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}
