"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { SeverityBadge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { Skeleton, SkeletonBlock } from "@/components/ui/skeleton";
import { Timestamp } from "@/components/ui/timestamp";
import { Button } from "@/components/ui/button";
import { getRecentEvents } from "@/lib/services/events";
import { getPipelineMetrics } from "@/lib/services/pipeline";
import { getAnomalyAlerts } from "@/lib/services/health";
import {
  getEventVolume,
  getCriticalEvents,
  getThroughput,
  getProcessingErrors,
} from "@/lib/services/analytics";
import { fetchSources } from "@/lib/services/sources";
import { useUIStore } from "@/lib/store/ui";
import { useInterval } from "@/lib/utils/hooks";
import { formatNumber, formatRate, formatPercent, formatDuration } from "@/lib/utils/format";
import type { NormalizedEvent, PipelineMetrics, AnomalyAlert, LogSource, ThroughputPoint, ProcessingError } from "@/lib/types";
import { ThroughputChart, NormalizationCoverage, ErrorStream, SystemHealthBlock } from "./components";
import Link from "next/link";
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Zap,
  RefreshCw,
  Activity,
  ServerCrash
} from "lucide-react";

// ── Stage color map ──────────────────────────────────────────────
const STAGE_COLORS: Record<string, string> = {
  ingest: "#8b5cf6",
  format_detection: "#06b6d4",
  parser_match: "#3b82f6",
  field_extraction: "#3b82f6",
  normalization: "#22c55e",
  schema_validation: "#22c55e",
  enrichment: "#eab308",
  output: "#f97316",
};

const STAGE_LABELS: Record<string, string> = {
  ingest: "Ingest",
  format_detection: "Format Det.",
  parser_match: "Parser Match",
  field_extraction: "Extraction",
  normalization: "Normalize",
  schema_validation: "Validate",
  enrichment: "Enrich",
  output: "Output",
};

// ── Severity Row ─────────────────────────────────────────────────
function EventRow({ event, isNew }: { event: NormalizedEvent; isNew?: boolean }) {
  return (
    <Link
      href={`/explorer/${event.id}`}
      className={`flex items-center gap-3 px-4 py-2 hover:bg-[#0d1117] transition-colors border-b border-[#1e2d3d]/50 group ${isNew ? "animate-slide-in-row" : ""}`}
    >
      <SeverityBadge severity={event.severity} size="xs" />
      <span className="text-[#94a3b8] text-xs font-mono w-40 flex-shrink-0 truncate">
        {event.source_name.split("—")[0].trim()}
      </span>
      <span className="text-[#e2e8f0] text-xs flex-1 truncate font-mono">
        {event.action}
      </span>
      <span className="text-[#64748b] text-[10px] font-mono flex-shrink-0 hidden xl:block truncate max-w-[150px]">
        {event.actor.user ?? event.actor.ip ?? "—"}
      </span>
      <Timestamp iso={event.timestamp} className="text-[10px] flex-shrink-0 w-24 text-right" />
    </Link>
  );
}

// ── Anomaly Row ──────────────────────────────────────────────────
function AnomalyRow({ alert }: { alert: AnomalyAlert }) {
  const statusColors: Record<string, string> = {
    open: "#ef4444",
    investigating: "#eab308",
    resolved: "#22c55e",
    false_positive: "#6b7280",
  };

  return (
    <Link
      href={`/detections`}
      className="flex items-start gap-3 px-4 py-3 hover:bg-[#0d1117] transition-colors border-b border-[#1e2d3d]/50 group"
    >
      <SeverityBadge severity={alert.severity} size="xs" showDot className="mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[#e2e8f0] text-xs font-medium truncate">{alert.title}</div>
        <div className="text-[#64748b] text-[10px] mt-0.5 leading-relaxed line-clamp-2">
          {alert.description}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className="text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded"
          style={{
            color: statusColors[alert.status],
            backgroundColor: `${statusColors[alert.status]}15`,
            border: `1px solid ${statusColors[alert.status]}33`,
          }}
        >
          {alert.status}
        </span>
        <Timestamp iso={alert.detected_at} className="text-[10px]" />
      </div>
    </Link>
  );
}

// ── Pipeline Stage ────────────────────────────────────────────────
function PipelineStageBar({ stage }: { stage: PipelineMetrics["stages"][0] }) {
  const color = STAGE_COLORS[stage.stage] ?? "#64748b";
  const statusIcon = {
    healthy: <CheckCircle2 className="w-3 h-3" style={{ color: "#22c55e" }} />,
    degraded: <AlertTriangle className="w-3 h-3" style={{ color: "#eab308" }} />,
    error: <XCircle className="w-3 h-3" style={{ color: "#ef4444" }} />,
    idle: <Clock className="w-3 h-3" style={{ color: "#6b7280" }} />,
  };

  return (
    <div className="flex items-center gap-3 py-2 px-4 border-b border-[#1e2d3d]/50 hover:bg-[#0d1117] transition-colors">
      <div className="flex items-center gap-2 w-28 flex-shrink-0">
        {statusIcon[stage.status]}
        <span className="text-[#94a3b8] text-[10px] font-mono">{STAGE_LABELS[stage.stage]}</span>
      </div>
      {/* Throughput bar */}
      <div className="flex-1 h-1.5 bg-[#1c2433] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${Math.min(100, (stage.events_per_sec / 700) * 100)}%`,
            backgroundColor: color,
            opacity: 0.7,
          }}
        />
      </div>
      <span
        className="text-[10px] font-mono w-14 text-right flex-shrink-0"
        style={{ color }}
      >
        {formatRate(stage.events_per_sec)}
      </span>
      <span className="text-[#64748b] text-[10px] font-mono w-16 text-right flex-shrink-0 hidden lg:block">
        {formatDuration(stage.avg_latency_ms)}
      </span>
      <span
        className="text-[10px] font-mono w-12 text-right flex-shrink-0 hidden xl:block"
        style={{ color: stage.error_rate > 0.005 ? "#eab308" : "#374151" }}
      >
        {(stage.error_rate * 100).toFixed(2)}%
      </span>
    </div>
  );
}

// ── Source Row ────────────────────────────────────────────────────
function SourceRow({ source }: { source: LogSource }) {
  return (
    <Link
      href={`/sources/${source.id}`}
      className="flex items-center gap-3 px-4 py-2 hover:bg-[#0d1117] transition-colors border-b border-[#1e2d3d]/50"
    >
      <StatusDot status={source.status} size="xs" />
      <span className="text-[#e2e8f0] text-xs flex-1 truncate font-medium">
        {source.name.split("—")[0].trim()}
      </span>
      <span className="text-[#64748b] text-[10px] font-mono uppercase tracking-wider flex-shrink-0 hidden md:block">
        {source.format.replace(/_/g, " ")}
      </span>
      <span className="text-[#94a3b8] text-[10px] font-mono w-20 text-right flex-shrink-0">
        {formatNumber(source.metrics.events_per_min)}/min
      </span>
      <span
        className={`text-[10px] font-mono w-12 text-right flex-shrink-0 ${
          source.metrics.parse_success_rate > 0.99
            ? "text-[#86efac]"
            : source.metrics.parse_success_rate > 0.95
            ? "text-[#fde68a]"
            : "text-[#fca5a5]"
        }`}
      >
        {formatPercent(source.metrics.parse_success_rate)}
      </span>
    </Link>
  );
}

// ════════════════════════════════════════════════════════════════
// Overview Page
// ════════════════════════════════════════════════════════════════

export default function OverviewPage() {
  const { liveFeedActive } = useUIStore();

  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [pipeline, setPipeline] = useState<PipelineMetrics | null>(null);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [sources, setSources] = useState<LogSource[]>([]);
  const [volumeData, setVolumeData] = useState<number[]>([]);
  const [criticalData, setCriticalData] = useState<number[]>([]);
  const [throughputData, setThroughputData] = useState<ThroughputPoint[]>([]);
  const [errors, setErrors] = useState<ProcessingError[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const [evts, pipe, alts, srcs, vol, crit, thru, errs] = await Promise.all([
      getRecentEvents(20),
      getPipelineMetrics(),
      getAnomalyAlerts(),
      fetchSources(),
      getEventVolume("1h"),
      getCriticalEvents("1h"),
      getThroughput("1h"),
      getProcessingErrors(15),
    ]);
    setEvents((prev) => {
      const prevIds = new Set(prev.map((e) => e.id));
      const newIds = new Set(evts.filter((e) => !prevIds.has(e.id)).map((e) => e.id));
      if (newIds.size > 0) setNewEventIds(newIds);
      return evts;
    });
    setPipeline(pipe);
    setAlerts(alts);
    setSources(srcs.slice(0, 8));
    setVolumeData(vol.slice(-30).map((p) => p.value));
    setCriticalData(crit.slice(-30).map((p) => p.value));
    setThroughputData(thru);
    setErrors(errs);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  // Initial data load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch; state updates happen after await
    void load();
  }, [load]);

  // Clear new event highlights
  useEffect(() => {
    if (newEventIds.size > 0) {
      const t = setTimeout(() => setNewEventIds(new Set()), 800);
      return () => clearTimeout(t);
    }
  }, [newEventIds]);

  // Live refresh
  useInterval(load, liveFeedActive ? 3000 : null);

  const openAlerts = alerts.filter((a) => a.status === "open" || a.status === "investigating");
  const totalEventsPerSec = pipeline?.total_events_per_sec ?? 0;
  const parseRate = pipeline?.parse_success_rate ?? 0;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Overview"
        description="System status, pipeline health, and recent activity"
        actions={
          <div className="flex items-center gap-2">
            <span
              className="text-[#64748b] text-[10px] font-mono hidden sm:block"
              suppressHydrationWarning
            >
              {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : "Updating…"}
            </span>
            <Button
              variant="ghost"
              size="xs"
              onClick={load}
              leftIcon={<RefreshCw className="w-3 h-3" />}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* ── System Metric Strip ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-px bg-[#1e2d3d] border-b border-[#1e2d3d]">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#080b0f] p-3">
              <Skeleton className="h-2 w-16 mb-2" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))
        ) : (
          <>
            <MetricCard
              label="Events / sec"
              value={formatNumber(totalEventsPerSec)}
              delta={8.4}
              sparkData={volumeData}
              sparkColor="#3b82f6"
              className="rounded-none border-none"
            />
            <MetricCard
              label="Events today"
              value={formatNumber(pipeline?.total_events_today ?? 0)}
              delta={12.1}
              className="rounded-none border-none"
            />
            <MetricCard
              label="Parse success"
              value={formatPercent(parseRate)}
              delta={0.2}
              sparkData={[98.4, 98.5, 98.3, 98.6, 98.7, 98.4, 98.5]}
              sparkColor="#22c55e"
              valueColor={parseRate > 0.98 ? "#86efac" : parseRate > 0.95 ? "#fde68a" : "#fca5a5"}
              className="rounded-none border-none"
            />
            <MetricCard
              label="Critical events"
              value={formatNumber(criticalData.reduce((a, b) => a + b, 0))}
              delta={89.4}
              sparkData={criticalData}
              sparkColor="#ef4444"
              valueColor="#fca5a5"
              className="rounded-none border-none"
            />
            <MetricCard
              label="Kafka lag"
              value={formatNumber(pipeline?.kafka_consumer_lag ?? 0)}
              unit="msgs"
              delta={-4.2}
              sparkColor="#eab308"
              className="rounded-none border-none"
            />
            <MetricCard
              label="Active sources"
              value={sources.filter((s) => s.status === "active").length}
              description={`${sources.filter((s) => s.status === "error").length} in error`}
              className="rounded-none border-none"
            />
          </>
        )}
      </div>

      {/* ── Main Dashboard Layout ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        
        {/* Row 1: Main Chart & System Mini-blocks */}
        <div className="grid grid-cols-1 xl:grid-cols-4 border-b border-[#1e2d3d] min-h-[260px] flex-shrink-0">
          {/* Main Throughput Chart (Spans 3 cols) */}
          <div className="xl:col-span-3 flex flex-col border-r border-[#1e2d3d] bg-[#050709]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e2d3d]">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-[#3b82f6]" />
                <span className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">
                  Live Event Throughput
                </span>
              </div>
              <select className="bg-[#0d1117] border border-[#1e2d3d] text-[#e2e8f0] text-[10px] font-mono px-2 py-1 rounded outline-none">
                <option>Last 1 Hour</option>
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
              </select>
            </div>
            <div className="flex-1 p-2">
              {loading ? (
                <SkeletonBlock rows={8} />
              ) : (
                <ThroughputChart data={throughputData} />
              )}
            </div>
          </div>

          {/* Right Column: Normalization Coverage & System Health */}
          <div className="flex flex-col">
            <div className="flex flex-col h-1/2 border-b border-[#1e2d3d] bg-[#050709]">
              <div className="px-4 py-2 border-b border-[#1e2d3d]">
                <span className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">
                  Normalization Coverage
                </span>
              </div>
              <div className="flex-1 p-4">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <NormalizationCoverage coverage={pipeline?.normalization_coverage ?? 0} />
                )}
              </div>
            </div>
            <div className="flex flex-col h-1/2">
              <div className="px-4 py-2 border-b border-[#1e2d3d] bg-[#050709]">
                <span className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">
                  System Health
                </span>
              </div>
              <div className="flex-1">
                {loading ? (
                  <Skeleton className="h-full w-full rounded-none" />
                ) : (
                  <SystemHealthBlock />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Pipeline, Anomalies, Sources */}
        <div className="grid grid-cols-1 xl:grid-cols-3 border-b border-[#1e2d3d] min-h-[320px] flex-shrink-0">
          {/* Pipeline Health */}
          <div className="flex flex-col border-r border-[#1e2d3d]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2d3d] flex-shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#8b5cf6]" />
                <span className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">
                  Pipeline Stages
                </span>
              </div>
              <Link
                href="/pipeline"
                className="flex items-center gap-1 text-[#64748b] hover:text-[#94a3b8] text-[10px] font-mono transition-colors"
              >
                Detail <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex items-center gap-3 px-4 py-1 bg-[#050709] border-b border-[#1e2d3d]/50">
              <span className="text-[#374151] text-[9px] font-mono uppercase tracking-widest w-28">Stage</span>
              <span className="text-[#374151] text-[9px] font-mono uppercase tracking-widest flex-1">Throughput</span>
              <span className="text-[#374151] text-[9px] font-mono uppercase tracking-widest w-14 text-right">Rate</span>
              <span className="text-[#374151] text-[9px] font-mono uppercase tracking-widest w-16 text-right hidden lg:block">Latency</span>
            </div>
            {loading ? (
              <SkeletonBlock rows={8} />
            ) : (
              pipeline?.stages.map((stage) => (
                <PipelineStageBar key={stage.stage} stage={stage} />
              ))
            )}
          </div>

          {/* Recent Anomalies */}
          <div className="flex flex-col border-r border-[#1e2d3d]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2d3d] flex-shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444]" />
                <span className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">
                  Recent Anomalies
                </span>
                {openAlerts.length > 0 && (
                  <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-[#450a0a] text-[#fca5a5] border border-[#ef4444]/30">
                    {openAlerts.length}
                  </span>
                )}
              </div>
              <Link
                href="/detections"
                className="flex items-center gap-1 text-[#64748b] hover:text-[#94a3b8] text-[10px] font-mono transition-colors"
              >
                All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto min-h-[250px]">
              {loading ? (
                <SkeletonBlock rows={4} />
              ) : openAlerts.length === 0 ? (
                <div className="flex items-center justify-center h-full gap-2 text-[#374151] text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
                  No active alerts
                </div>
              ) : (
                openAlerts.map((alert) => (
                  <AnomalyRow key={alert.id} alert={alert} />
                ))
              )}
            </div>
          </div>

          {/* Active Sources */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2d3d] flex-shrink-0">
              <span className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">
                Sources
              </span>
              <Link
                href="/sources"
                className="flex items-center gap-1 text-[#64748b] hover:text-[#94a3b8] text-[10px] font-mono transition-colors"
              >
                All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex items-center gap-3 px-4 py-1 bg-[#050709] border-b border-[#1e2d3d]/50 flex-shrink-0">
              <span className="text-[#374151] text-[9px] font-mono uppercase tracking-widest flex-1">Name</span>
              <span className="text-[#374151] text-[9px] font-mono uppercase tracking-widest w-20 text-right">Events/min</span>
              <span className="text-[#374151] text-[9px] font-mono uppercase tracking-widest w-12 text-right">Parse%</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <SkeletonBlock rows={6} />
              ) : (
                sources.map((source) => (
                  <SourceRow key={source.id} source={source} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Event Feed & Processing Errors */}
        <div className="grid grid-cols-1 xl:grid-cols-3 flex-1 min-h-[300px]">
          {/* Live Event Feed (Spans 2 cols) */}
          <div className="xl:col-span-2 flex flex-col border-r border-[#1e2d3d]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2d3d] flex-shrink-0">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#3b82f6]" />
                <span className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">
                  Event Feed
                </span>
                {liveFeedActive && (
                  <span className="flex items-center gap-1 text-[#86efac] text-[9px] font-mono">
                    <StatusDot status="active" size="xs" />
                    LIVE
                  </span>
                )}
              </div>
              <Link
                href="/explorer"
                className="flex items-center gap-1 text-[#64748b] hover:text-[#94a3b8] text-[10px] font-mono transition-colors"
              >
                All events <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex items-center gap-3 px-4 py-1.5 bg-[#050709] border-b border-[#1e2d3d]/50 flex-shrink-0">
              <span className="text-[#374151] text-[9px] font-mono uppercase tracking-widest w-[56px]">Severity</span>
              <span className="text-[#374151] text-[9px] font-mono uppercase tracking-widest w-40">Source</span>
              <span className="text-[#374151] text-[9px] font-mono uppercase tracking-widest flex-1">Action</span>
              <span className="text-[#374151] text-[9px] font-mono uppercase tracking-widest w-[150px] hidden xl:block">Actor</span>
              <span className="text-[#374151] text-[9px] font-mono uppercase tracking-widest w-24 text-right">Time</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <SkeletonBlock rows={12} />
              ) : events.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-[#374151] text-xs">
                  No events
                </div>
              ) : (
                events.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    isNew={newEventIds.has(event.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Processing Errors */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2d3d] bg-[#050709] flex-shrink-0">
              <div className="flex items-center gap-2">
                <ServerCrash className="w-3.5 h-3.5 text-[#eab308]" />
                <span className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">
                  Processing Errors
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <SkeletonBlock rows={5} />
              ) : (
                <ErrorStream errors={errors} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
