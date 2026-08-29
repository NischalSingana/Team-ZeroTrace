"use client";

import { formatAbsolute, formatRelative } from "@/lib/utils/format";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface TimestampProps {
  iso: string;
  defaultMode?: "relative" | "absolute";
  className?: string;
  mono?: boolean;
}

export function Timestamp({
  iso,
  defaultMode = "relative",
  className,
  mono = true,
}: TimestampProps) {
  const [mode, setMode] = useState<"relative" | "absolute">(defaultMode);

  const display = mode === "relative" ? formatRelative(iso) : formatAbsolute(iso);
  const title = mode === "relative" ? formatAbsolute(iso) : formatRelative(iso);

  return (
    <button
      type="button"
      onClick={() => setMode((m) => (m === "relative" ? "absolute" : "relative"))}
      title={title}
      className={cn(
        "text-left text-[#94a3b8] hover:text-[#e2e8f0] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3b82f6] rounded",
        mono && "font-mono text-xs",
        !mono && "text-sm",
        className
      )}
      aria-label={`Timestamp: ${display}. Click to toggle format.`}
      suppressHydrationWarning
    >
      {display}
    </button>
  );
}
