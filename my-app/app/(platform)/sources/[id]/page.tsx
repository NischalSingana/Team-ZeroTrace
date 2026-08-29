"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { StatusDot } from "@/components/ui/status-dot";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Timestamp } from "@/components/ui/timestamp";
import { getSourceById } from "@/lib/services/sources";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import type { LogSource } from "@/lib/types";
import {
  ArrowLeft,
  Activity,
  Database,
  Cpu,
  AlertTriangle,
  Server,
  Globe,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const TRANSPORT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  kafka: Activity,
  syslog_tcp: Server,
  syslog_udp: Server,
  file: FileText,
  api: Globe,
  s3: Database,
  agent: Cpu,
};

function MetricCard({ label, value, sub, intent = "neutral" }: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  intent?: "neutral" | "success" | "warning" | "error";
}) {
  const colorClass = {
    neutral: "text-[#e2e8f0]",
    success: "text-[#86efac]",
    warning: "text-[#fde68a]",
    error: "text-[#fca5a5]",
  }[intent];

  return (
    <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded-lg p-4">
      <div className="text-[#64748b] text-[9px] uppercase font-bold tracking-widest font-mono mb-1">
        {label}
      </div>
      <div className={cn("text-xl font-semibold tracking-tight", colorClass)}>{value}</div>
      {sub && <div className="text-[#64748b] text-[10px] font-mono mt-1">{sub}</div>}
    </div>
  );
}

export default function SourceDetailPage() {
  const params = useParams<{ id: string }>();
  const [source, setSource] = useState<LogSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    getSourceById(params.id)
      .then((s) => {
        if (s) {
          setSource(s);
        } else {
          setError("Source not found");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load source");
        setLoading(false);
      });
  }, [params?.id]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#050709]">
        <div className="px-6 py-4 border-b border-[#1e2d3d]">
          <Skeleton className="h-4 w-64 mb-2 bg-[#1e2d3d]" />
          <Skeleton className="h-3 w-40 bg-[#1e2d3d]" />
        </div>
        <div className="p-6 space-y-4">
          <Skeleton className="h-32 w-full bg-[#1e2d3d]" />
          <Skeleton className="h-48 w-full bg-[#1e2d3d]" />
        </div>
      </div>
    );
  }

  if (error || !source) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-[#050709]">
        <AlertTriangle className="w-10 h-10 text-[#374151]" />
        <div className="text-[#94a3b8] text-sm">{error || "Source not found"}</div>
        <Link href="/sources">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-3 h-3" />}>
            Back to Sources
          </Button>
        </Link>
      </div>
    );
  }

  const TransportIcon = TRANSPORT_ICONS[source.transport] ?? Server;
  const parseIntent = source.metrics.parse_success_rate > 0.99
    ? "success"
    : source.metrics.parse_success_rate > 0.95
      ? "warning"
      : "error";
  const lagIntent = source.metrics.lag_seconds > 10 ? "warning" : "neutral";

  return (
    <div className="flex flex-col h-full bg-[#050709] overflow-hidden">
      <PageHeader
        title={source.name}
        description={source.description}
        badge={
          <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase">
            <StatusDot status={source.status} size="xs" />
            {source.status}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href="/sources">
              <Button variant="ghost" size="xs" leftIcon={<ArrowLeft className="w-3 h-3" />}>
                Sources
              </Button>
            </Link>
          </div>
        }
        breadcrumbs={[
          { label: "Sources", href: "/sources" },
          { label: source.name.split(" — ")[0] },
        ]}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Configuration summary */}
          <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded-lg p-5">
            <h3 className="text-[#e2e8f0] text-sm font-semibold tracking-tight mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#3b82f6]" /> Source Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-[#64748b] text-[9px] uppercase font-mono tracking-widest block mb-1">Type</span>
                <span className="text-[#e2e8f0] text-sm font-mono capitalize">{source.type.replace(/_/g, " ")}</span>
              </div>
              <div>
                <span className="text-[#64748b] text-[9px] uppercase font-mono tracking-widest block mb-1">Format</span>
                <span className="text-[#94a3b8] text-sm font-mono bg-[#1c2433] px-2 py-0.5 rounded border border-[#243044]">
                  {source.format}
                </span>
              </div>
              <div>
                <span className="text-[#64748b] text-[9px] uppercase font-mono tracking-widest block mb-1">Transport</span>
                <span className="text-[#e2e8f0] text-sm font-mono flex items-center gap-1.5">
                  <TransportIcon className="w-3.5 h-3.5 text-[#64748b]" />
                  {source.transport}
                </span>
              </div>
              <div>
                <span className="text-[#64748b] text-[9px] uppercase font-mono tracking-widest block mb-1">Parser</span>
                <span className="text-[#a5b4fc] text-sm font-mono">{source.parser_id ?? "Auto-detect"}</span>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div>
            <h3 className="text-[#94a3b8] text-[10px] uppercase font-bold tracking-widest font-mono mb-3 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#8b5cf6]" /> Live Metrics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Events / min"
                value={formatNumber(source.metrics.events_per_min)}
                sub={`${formatNumber(source.metrics.events_per_min_delta)}% vs last interval`}
              />
              <MetricCard
                label="Parse Success"
                value={formatPercent(source.metrics.parse_success_rate)}
                intent={parseIntent}
              />
              <MetricCard
                label="Error Rate"
                value={formatPercent(source.metrics.error_rate)}
                sub={`${(source.metrics.error_rate * 100).toFixed(2)}% of events`}
                intent={source.metrics.error_rate > 0.05 ? "error" : source.metrics.error_rate > 0.01 ? "warning" : "success"}
              />
              <MetricCard
                label="Processing Lag"
                value={`${source.metrics.lag_seconds.toFixed(1)}s`}
                sub={<Timestamp iso={source.metrics.last_event_at} className="text-[10px]" />}
                intent={lagIntent}
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-6 border-t border-[#1e2d3d]">
            <div className="text-[#64748b] text-[10px] font-mono">
              Created <Timestamp iso={source.created_at} className="text-[10px]" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Edit Source
              </Button>
              <Button variant="primary" size="sm">
                View Pipeline
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
