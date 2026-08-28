import { cn } from "@/lib/utils/cn";
import { getSeverityConfig } from "@/lib/utils/severity";
import type { Severity } from "@/lib/types";

interface SeverityBadgeProps {
  severity: Severity;
  showDot?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function SeverityBadge({
  severity,
  showDot = true,
  size = "sm",
  className,
}: SeverityBadgeProps) {
  const config = getSeverityConfig(severity);

  const sizeClasses = {
    xs: "text-[9px] px-1 py-0.5 gap-1",
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1.5",
  };

  const dotSizes = {
    xs: "w-1 h-1",
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded font-mono font-bold tracking-widest uppercase border",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: config.mutedBg,
        color: config.color,
        borderColor: `${config.color}33`,
      }}
    >
      {showDot && (
        <span
          className={cn("rounded-full flex-shrink-0", dotSizes[size], {
            "animate-pulse-dot": severity === "critical",
          })}
          style={{ backgroundColor: config.color }}
        />
      )}
      {config.label}
    </span>
  );
}

// Text-only severity color
interface SeverityTextProps {
  severity: Severity;
  children: React.ReactNode;
  className?: string;
}

export function SeverityText({ severity, children, className }: SeverityTextProps) {
  const config = getSeverityConfig(severity);
  return (
    <span className={className} style={{ color: config.color }}>
      {children}
    </span>
  );
}
