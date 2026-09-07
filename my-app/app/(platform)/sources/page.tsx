"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatusDot } from "@/components/ui/status-dot";
import { Button } from "@/components/ui/button";
import { SkeletonBlock } from "@/components/ui/skeleton";
import { Timestamp } from "@/components/ui/timestamp";
import { BackendErrorState } from "@/components/ui/error-fallback";
import { fetchSources } from "@/lib/services/sources";
import { isOfflineError } from "@/lib/services/api";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import type { LogSource } from "@/lib/types";
import { Plus } from "lucide-react";

export default function SourcesPage() {
  const [sources, setSources] = useState<LogSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const srcs = await fetchSources();
      setSources(srcs);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const active = sources.filter((s) => s.status === "active").length;
  const errors = sources.filter((s) => s.status === "error").length;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Sources"
        description={`${sources.length} log sources · ${active} active · ${errors} in error`}
        actions={
          <Link href="/sources/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Source
            </Button>
          </Link>
        }
      />

      {/* Summary stats */}
      <div className="flex items-center gap-6 px-6 py-3 border-b border-[#1e2d3d] bg-[#050709] text-[10px] font-mono flex-shrink-0">
        <span className="text-[#86efac]">{active} active</span>
        <span className="text-[#eab308]">{sources.filter(s=>s.status==="degraded").length} degraded</span>
        <span className="text-[#fca5a5]">{errors} error</span>
        <span className="text-[#64748b]">{sources.filter(s=>s.status==="inactive").length} inactive</span>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-[#1e2d3d] bg-[#050709] sticky top-0 z-10 text-[9px] font-mono uppercase tracking-widest text-[#374151]">
          <span className="w-4" />
          <span className="flex-1 min-w-0">Source</span>
          <span className="w-24 hidden md:block">Format</span>
          <span className="w-20 hidden lg:block">Transport</span>
          <span className="w-20 text-right">Events/min</span>
          <span className="w-14 text-right">Parse%</span>
          <span className="w-14 text-right">Lag</span>
          <span className="w-20 text-right hidden xl:block">Last Event</span>
        </div>

        {loading ? (
          <SkeletonBlock rows={12} />
        ) : error ? (
          <BackendErrorState
            error={error}
            onRetry={load}
            title={isOfflineError(error) ? "Backend is offline" : "Failed to load sources"}
            description={
              isOfflineError(error)
                ? "Could not reach the ZeroTrace API. Start the backend service and try again."
                : "Could not load log sources. Check the backend status and retry."
            }
          />
        ) : (
          sources.map((src) => (
            <Link
              key={src.id}
              href={`/sources/${src.id}`}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1e2d3d]/50 hover:bg-[#0d1117] transition-colors group"
            >
              <StatusDot status={src.status} size="xs" />
              <div className="flex-1 min-w-0">
                <div className="text-[#e2e8f0] text-xs font-medium truncate">{src.name}</div>
                <div className="text-[#64748b] text-[10px] truncate mt-0.5">{src.description}</div>
              </div>
              <span className="text-[#64748b] text-[10px] font-mono w-24 hidden md:block truncate">{src.format.replace(/_/g, " ")}</span>
              <span className="text-[#64748b] text-[10px] font-mono w-20 hidden lg:block truncate">{src.transport}</span>
              <span className="text-[#94a3b8] text-[10px] font-mono w-20 text-right">
                {src.status === "error" ? <span className="text-[#fca5a5]">offline</span> : formatNumber(src.metrics.events_per_min)}
              </span>
              <span
                className="text-[10px] font-mono w-14 text-right"
                style={{
                  color: src.metrics.parse_success_rate > 0.99 ? "#86efac" :
                    src.metrics.parse_success_rate > 0.95 ? "#fde68a" : "#fca5a5"
                }}
              >
                {src.status === "error" ? "—" : formatPercent(src.metrics.parse_success_rate)}
              </span>
              <span
                className="text-[10px] font-mono w-14 text-right"
                style={{
                  color: src.metrics.lag_seconds > 10 ? "#fde68a" : "#64748b"
                }}
              >
                {src.status === "error" ? "—" : `${src.metrics.lag_seconds.toFixed(1)}s`}
              </span>
              <span className="hidden xl:block w-20 text-right">
                <Timestamp iso={src.metrics.last_event_at} className="text-[10px]" />
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
