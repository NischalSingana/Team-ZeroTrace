"use client";

import { cn } from "@/lib/utils/cn";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  maxWidth?: number;
}

export function Tooltip({
  children,
  content,
  position = "top",
  className,
  maxWidth = 220,
}: TooltipProps) {
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span
        className={cn(
          "pointer-events-none absolute z-50 rounded border border-[#243044] bg-[#0d1117] px-2.5 py-1.5 text-[11px] leading-snug text-[#e2e8f0] opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 whitespace-normal",
          positionClasses[position]
        )}
        style={{ maxWidth }}
        role="tooltip"
      >
        {content}
        <span
          className={cn(
            "absolute h-2 w-2 rotate-45 border border-[#243044] bg-[#0d1117]",
            position === "top" && "bottom-[-5px] left-1/2 -translate-x-1/2 border-t-0 border-l-0",
            position === "bottom" && "top-[-5px] left-1/2 -translate-x-1/2 border-b-0 border-r-0",
            position === "left" && "right-[-5px] top-1/2 -translate-y-1/2 border-l-0 border-b-0",
            position === "right" && "left-[-5px] top-1/2 -translate-y-1/2 border-r-0 border-t-0"
          )}
        />
      </span>
    </span>
  );
}

interface MetricLabelProps {
  label: string;
  tooltip: string;
  className?: string;
}

export function MetricLabel({ label, tooltip, className }: MetricLabelProps) {
  return (
    <Tooltip content={tooltip} className={className}>
      <span className="cursor-help border-b border-dashed border-[#475569] hover:border-[#94a3b8] transition-colors">
        {label}
      </span>
    </Tooltip>
  );
}
