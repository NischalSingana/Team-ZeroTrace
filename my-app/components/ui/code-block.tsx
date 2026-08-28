"use client";

import { cn } from "@/lib/utils/cn";
import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";

interface CodeBlockProps {
  content: string;
  language?: string;
  label?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  maxHeight?: number;
  className?: string;
}

export function CodeBlock({
  content,
  language,
  label,
  collapsible = false,
  defaultCollapsed = false,
  maxHeight = 400,
  className,
}: CodeBlockProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "border border-[#1e2d3d] rounded overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-[#0d1117] px-3 py-2 border-b border-[#1e2d3d]">
        <div className="flex items-center gap-2">
          {collapsible && (
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="text-[#64748b] hover:text-[#94a3b8] transition-colors"
              aria-label={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          <span className="text-[#64748b] text-[10px] font-mono uppercase tracking-widest">
            {label ?? language ?? "raw"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[#64748b] hover:text-[#94a3b8] transition-colors text-[10px] font-mono"
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#22c55e]" />
              <span className="text-[#22c55e]">copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              copy
            </>
          )}
        </button>
      </div>

      {/* Content */}
      {!collapsed && (
        <div
          className="overflow-auto"
          style={{ maxHeight }}
        >
          <pre className="p-4 text-[0.8125rem] leading-relaxed font-mono text-[#94a3b8] whitespace-pre bg-[#050709] m-0">
            <code>{content}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
