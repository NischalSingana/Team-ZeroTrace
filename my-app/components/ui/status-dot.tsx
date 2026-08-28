import { cn } from "@/lib/utils/cn";

interface StatusDotProps {
  status: "healthy" | "degraded" | "error" | "idle" | "up" | "down" | "active" | "inactive" | "onboarding";
  pulse?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const statusColors: Record<string, string> = {
  healthy: "#22c55e",
  up: "#22c55e",
  active: "#22c55e",
  degraded: "#eab308",
  idle: "#64748b",
  inactive: "#64748b",
  error: "#ef4444",
  down: "#ef4444",
  onboarding: "#06b6d4",
};

const sizeClasses = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
};

export function StatusDot({ status, pulse, size = "sm", className }: StatusDotProps) {
  const color = statusColors[status] ?? "#64748b";
  const shouldPulse = pulse ?? (status === "active" || status === "up" || status === "healthy");

  return (
    <span
      className={cn(
        "inline-block rounded-full flex-shrink-0",
        sizeClasses[size],
        shouldPulse && "animate-pulse-dot",
        className
      )}
      style={{ backgroundColor: color }}
      role="status"
      aria-label={status}
    />
  );
}

interface ServiceStatusBadgeProps {
  status: "up" | "down" | "degraded";
  children?: React.ReactNode;
}

export function ServiceStatusBadge({ status, children }: ServiceStatusBadgeProps) {
  const configs = {
    up: { color: "#22c55e", bg: "#052e16", border: "#22c55e33", label: "UP" },
    down: { color: "#ef4444", bg: "#450a0a", border: "#ef444433", label: "DOWN" },
    degraded: { color: "#eab308", bg: "#3a2f00", border: "#eab30833", label: "DEGRADED" },
  };
  const c = configs[status];

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold tracking-widest border"
      style={{ backgroundColor: c.bg, color: c.color, borderColor: c.border }}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          status === "up" && "animate-pulse-dot"
        )}
        style={{ backgroundColor: c.color }}
      />
      {children ?? c.label}
    </span>
  );
}
