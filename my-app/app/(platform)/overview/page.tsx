"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { SeverityBadge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { Skeleton, SkeletonBlock, SkeletonMetric } from "@/components/ui/skeleton";
import { Timestamp } from "@/components/ui/timestamp";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tooltip, MetricLabel } from "@/components/ui/tooltip";
import { getRecentEvents } from "@/lib/services/events";
import { getPipelineMetrics, getStreamState } from "@/lib/services/pipeline";
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
  ServerCrash,
  Inbox,
  FileSearch,
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
  format_detection: "Format Detection",
  parser_match: "Parser Match",
  field_extraction: "Field Extraction",
  normalization: "Normalization",
  schema_validation: "Schema Validation",
  enrichment: "Enrichment",
  output: "Output",
};

const STAGE_TOOLTIPS: Record<string, string> = {
  ingest: "Raw logs received from configured sources.",
  format_detection: "Identify the incoming log format (syslog, JSON, CEF, etc.).",
  parser_match: "Match the event against the best-fitting parser.",
  field_extraction: "Extract key-value fields from the raw event.",
  normalization: "Map extracted fields to the universal event schema.",
  schema_validation: "Validate that required schema fields are present.",
  enrichment: "Add context from threat intel, assets, and identity data.",
  output: "Write normalized events to downstream storage and SIEMs.",
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
      <div className="flex items-center gap-2 w-32 flex-shrink-0">
        {statusIcon[stage.status]}
        <Tooltip content={STAGE_TOOLTIPS[stage.stage] ?? stage.stage}>
          <span className="text-[#94a3b8] text-[10px] font-mono truncate">
            {STAGE_LABELS[stage.stage]}
          </span>
        </Tooltip>
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
      <Tooltip content="Events processed per second at this stage">
        <span
          className="text-[10px] font-mono w-14 text-right flex-shrink-0"
          style={{ color }}
        >
          {formatRate(stage.events_per_sec)}
        </span>
      </Tooltip>
      <Tooltip content="Average time spent processing an event at this stage">
        <span className="text-[#64748b] text-[10px] font-mono w-16 text-right flex-shrink-0 hidden lg:block">
          {formatDuration(stage.avg_latency_ms)}
        </span>
      </Tooltip>
      <Tooltip content="Percentage of events that failed at this stage">
        <span
          className="text-[10px] font-mono w-12 text-right flex-shrink-0 hidden xl:block"
          style={{ color: stage.error_rate > 0.005 ? "#eab308" : "#374151" }}
        >
          {(stage.error_rate * 100).toFixed(2)}%
        </span>
      </Tooltip>
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
  const { liveFeedActive, setLiveFeedActive } = useUIStore();

  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [pipeline, setPipeline] = useState<PipelineMetrics | null>(null);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [sources, setSources] = useState<LogSource[]>([]);
  const [volumeData, setVolumeData] = useState<number[]>([]);
  const [criticalData, setCriticalData] = useState<number[]>([]);
  const [throughputData, setThroughputData] = useState<ThroughputPoint[]>([]);
  const [errors, setErrors] = useState<ProcessingError[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const eventsRef = useRef<NormalizedEvent[]>([]);

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setApiErrors([]);

    // Sources are always fetched so the configured source list is visible;
    // their metrics are computed from actual events and will be zero when paused.
    const sourcesPromise = fetchSources();

    if (!liveFeedActive) {
      try {
        const srcs = await sourcesPromise;
        setSources(srcs.slice(0, 8));
      } catch (err) {
        setApiErrors((prev) => [
          ...prev,
          `Sources failed: ${err instanceof Error ? err.message : String(err)}`,
        ]);
      }
      // When the pipeline is paused, clear live data so we don't show stale numbers.
      eventsRef.current = [];
      setEvents([]);
      setPipeline(null);
      setAlerts([]);
      setVolumeData([]);
      setCriticalData([]);
      setThroughputData([]);
      setErrors([]);
      setLastRefresh(new Date());
      setLoading(false);
      return;
    }

    // Load every widget independently so one failing endpoint doesn't blank the whole page.
    const [srcsResult, evtsResult, pipeResult, altsResult, volResult, critResult, thruResult, errsResult] =
      await Promise.allSettled([
        sourcesPromise,
        getRecentEvents(20),
        getPipelineMetrics(),
        getAnomalyAlerts(),
        getEventVolume("1h"),
        getCriticalEvents("1h"),
        getThroughput("1h"),
        getProcessingErrors(15),
      ]);

    const nextErrors: string[] = [];

    if (srcsResult.status === "fulfilled") {
      setSources(srcsResult.value.slice(0, 8));
    } else {
      nextErrors.push(`Sources failed: ${srcsResult.reason instanceof Error ? srcsResult.reason.message : String(srcsResult.reason)}`);
    }

    if (evtsResult.status === "fulfilled") {
      const nextEvents = evtsResult.value;
      const prevIds = new Set(eventsRef.current.map((e) => e.id));
      const newIds = new Set(
        nextEvents.filter((e) => !prevIds.has(e.id)).map((e) => e.id)
      );
      if (newIds.size > 0) setNewEventIds(newIds);
      eventsRef.current = nextEvents;
      setEvents(nextEvents);
    } else {
      nextErrors.push(`Events failed: ${evtsResult.reason instanceof Error ? evtsResult.reason.message : String(evtsResult.reason)}`);
    }

    if (pipeResult.status === "fulfilled") {
      setPipeline(pipeResult.value);
    } else {
      nextErrors.push(`Pipeline failed: ${pipeResult.reason instanceof Error ? pipeResult.reason.message : String(pipeResult.reason)}`);
    }

    if (altsResult.status === "fulfilled") {
      setAlerts(altsResult.value);
    } else {
      nextErrors.push(`Alerts failed: ${altsResult.reason instanceof Error ? altsResult.reason.message : String(altsResult.reason)}`);
    }

    if (volResult.status === "fulfilled") {
      setVolumeData(volResult.value.slice(-30).map((p) => p.value));
    } else {
      nextErrors.push(`Volume failed: ${volResult.reason instanceof Error ? volResult.reason.message : String(volResult.reason)}`);
    }

    if (critResult.status === "fulfilled") {
      setCriticalData(critResult.value.slice(-30).map((p) => p.value));
    } else {
      nextErrors.push(`Critical events failed: ${critResult.reason instanceof Error ? critResult.reason.message : String(critResult.reason)}`);
    }

    if (thruResult.status === "fulfilled") {
      setThroughputData(thruResult.value);
    } else {
      nextErrors.push(`Throughput failed: ${thruResult.reason instanceof Error ? thruResult.reason.message : String(thruResult.reason)}`);
    }

    if (errsResult.status === "fulfilled") {
      setErrors(errsResult.value);
    } else {
      nextErrors.push(`Processing errors failed: ${errsResult.reason instanceof Error ? errsResult.reason.message : String(errsResult.reason)}`);
    }

    setApiErrors(nextErrors);
    setLastRefresh(new Date());
    setLoading(false);
  }, [liveFeedActive]);

  // Sync local streaming toggle with the backend state on mount.
  useEffect(() => {
    void getStreamState()
      .then((state) => {
        const streaming = state.is_streaming ?? state.status === "streaming";
        setLiveFeedActive(streaming);
      })
      .catch((err) => {
        console.error("Failed to sync stream state:", err);
        // Keep the existing persisted state so the UI doesn't flip unexpectedly.
      });
  }, [setLiveFeedActive]);

  // Initial data load
  useEffect(() => {
    void load(true);
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
        description="System status, pipeline health, and recent activity across all log sources."
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
              onClick={() => load(true)}
              leftIcon={<RefreshCw className="w-3 h-3" />}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {!liveFeedActive ? (
        <div className="flex-1 overflow-y-auto bg-[#050709] flex flex-col items-center justify-center p-8 min-h-[500px]">
          <EmptyState
            title="Run the pipeline to show the analysis and overview"
            description="The pipeline is currently paused. Start the live feed to see analytics and event throughput."
            icon={<Activity className="w-12 h-12 text-[#3b82f6]" />}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await import("@/lib/services/pipeline").then((m) => m.resumeStream());
                  } catch (e) {
                    console.error("Failed to start pipeline:", e);
                  }
                  setLiveFeedActive(true);
                  void load();
                }}
                rightIcon={<Zap className="w-3.5 h-3.5" />}
              >
                Start Pipeline
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {/* ── API Error Banner ─────────────────────────────────────── */}
          {apiErrors.length > 0 && (
            <div className="bg-[#450a0a]/60 border-b border-[#ef4444]/30 px-4 py-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ef4444] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[#fca5a5] text-xs font-medium">
                    Some dashboard data could not be loaded
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {apiErrors.slice(0, 3).map((err, i) => (
                      <li key={i} className="text-[#fca5a5]/80 text-[10px] font-mono truncate">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => load(true)}
                  leftIcon={<RefreshCw className="w-3 h-3" />}
                  className="text-[#fca5a5] hover:text-[#fff] hover:bg-[#ef4444]/20 flex-shrink-0"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* ── System Metric Strip ──────────────────────────────────── */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-px bg-[#1e2d3d] border-b border-[#1e2d3d]"
          >
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-[#080b0f]">
                  <SkeletonMetric />
                </div>
              ))
            ) : (
              <>
                <Tooltip content="Events processed per second across all pipeline stages" className="w-full">
                  <MetricCard
                    label="Events / sec"
                    value={formatNumber(totalEventsPerSec)}
                    delta={8.4}
                    sparkData={volumeData}
                    sparkColor="#3b82f6"
                    className="rounded-none border-none w-full"
                  />
                </Tooltip>
                <Tooltip content="Total events ingested today" className="w-full">
                  <MetricCard
                    label="Events today"
                    value={formatNumber(pipeline?.total_events_today ?? 0)}
                    delta={12.1}
                    className="rounded-none border-none w-full"
                  />
                </Tooltip>
                <Tooltip content="Percentage of events successfully parsed into the universal schema" className="w-full">
                  <MetricCard
                    label="Parse success"
                    value={formatPercent(parseRate)}
                    delta={0.2}
                    sparkData={[98.4, 98.5, 98.3, 98.6, 98.7, 98.4, 98.5]}
                    sparkColor="#22c55e"
                    valueColor={parseRate > 0.98 ? "#86efac" : parseRate > 0.95 ? "#fde68a" : "#fca5a5"}
                    className="rounded-none border-none w-full"
                  />
                </Tooltip>
                <Tooltip content="Total critical severity events in the selected time window" className="w-full">
                  <MetricCard
                    label="Critical events"
                    value={formatNumber(criticalData.reduce((a, b) => a + b, 0))}
                    delta={89.4}
                    sparkData={criticalData}
                    sparkColor="#ef4444"
                    valueColor="#fca5a5"
                    className="rounded-none border-none w-full"
                  />
                </Tooltip>
                <Tooltip content="Number of events waiting in the Kafka queue to be processed" className="w-full">
                  <MetricCard
                    label="Kafka lag"
                    value={formatNumber(pipeline?.kafka_consumer_lag ?? 0)}
                    unit="msgs"
                    delta={-4.2}
                    sparkColor="#eab308"
                    className="rounded-none border-none w-full"
                  />
                </Tooltip>
                <Tooltip content="Number of log sources currently streaming data" className="w-full">
                  <MetricCard
                    label="Active sources"
                    value={sources.filter((s) => s.status === "active").length}
                    description={`${sources.filter((s) => s.status === "error").length} in error`}
                    className="rounded-none border-none w-full"
                  />
                </Tooltip>
              </>
            )}
          </motion.div>

          {/* ── Main Dashboard Layout ────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            
            {/* Row 1: Main Chart & System Mini-blocks */}
            <div className="grid grid-cols-1 xl:grid-cols-4 border-b border-[#1e2d3d] min-h-[260px] flex-shrink-0">
              {/* Main Throughput Chart (Spans 3 cols) */}
              <div className="xl:col-span-3 flex flex-col border-r border-[#1e2d3d] bg-[#050709]">
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e2d3d]">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-[#3b82f6]" />
                    <MetricLabel
                      label="Live Event Throughput"
                      tooltip="Ingested, processed, and output event rates over the last hour."
                      className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider"
                    />
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
                    <MetricLabel
                      label="Normalization Coverage"
                      tooltip="Share of events that fully mapped to the universal schema."
                      className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider"
                    />
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
                    <MetricLabel
                      label="System Health"
                      tooltip="Status of core backend services."
                      className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider"
                    />
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
                    <MetricLabel
                      label="Pipeline Stages"
                      tooltip="Per-stage throughput, latency, and error rate."
                      className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider"
                    />
                  </div>
                  <Link
                    href="/pipeline"
                    className="flex items-center gap-1 text-[#64748b] hover:text-[#94a3b8] text-[10px] font-mono transition-colors"
                  >
                    Detail <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="flex items-center gap-3 px-4 py-1 bg-[#050709] border-b border-[#1e2d3d]/50">
                  <MetricLabel
                    label="Stage"
                    tooltip="Pipeline processing stage"
                    className="text-[#374151] text-[9px] font-mono uppercase tracking-widest w-32"
                  />
                  <MetricLabel
                    label="Throughput"
                    tooltip="Events per second at this stage"
                    className="text-[#374151] text-[9px] font-mono uppercase tracking-widest flex-1"
                  />
                  <MetricLabel
                    label="Rate"
                    tooltip="Events processed per second"
                    className="text-[#374151] text-[9px] font-mono uppercase tracking-widest w-14 text-right"
                  />
                  <MetricLabel
                    label="Latency"
                    tooltip="Average processing time at this stage"
                    className="text-[#374151] text-[9px] font-mono uppercase tracking-widest w-16 text-right hidden lg:block"
                  />
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
                    <MetricLabel
                      label="Recent Anomalies"
                      tooltip="Anomaly detections that are open or under investigation."
                      className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider"
                    />
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
                    <EmptyState
                      title="No active alerts"
                      description="The pipeline is healthy and no anomalies require attention."
                      icon={<CheckCircle2 className="w-8 h-8 text-[#22c55e]" />}
                      action={
                        <Link href="/detections">
                          <Button variant="outline" size="xs" rightIcon={<ArrowRight className="w-3 h-3" />}>
                            View detections
                          </Button>
                        </Link>
                      }
                    />
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
                  <MetricLabel
                    label="Sources"
                    tooltip="Log sources currently sending data to ZeroTrace."
                    className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider"
                  />
                  <Link
                    href="/sources"
                    className="flex items-center gap-1 text-[#64748b] hover:text-[#94a3b8] text-[10px] font-mono transition-colors"
                  >
                    All <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="flex items-center gap-3 px-4 py-1 bg-[#050709] border-b border-[#1e2d3d]/50 flex-shrink-0">
                  <MetricLabel
                    label="Name"
                    tooltip="Log source name"
                    className="text-[#374151] text-[9px] font-mono uppercase tracking-widest flex-1"
                  />
                  <MetricLabel
                    label="Events/min"
                    tooltip="Events received per minute"
                    className="text-[#374151] text-[9px] font-mono uppercase tracking-widest w-20 text-right"
                  />
                  <MetricLabel
                    label="Parse success"
                    tooltip="Percentage of events successfully parsed"
                    className="text-[#374151] text-[9px] font-mono uppercase tracking-widest w-12 text-right"
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <SkeletonBlock rows={6} />
                  ) : sources.length === 0 ? (
                    <EmptyState
                      title="No sources configured"
                      description="Add a log source to start ingesting events."
                      icon={<Inbox className="w-8 h-8" />}
                      action={
                        <Link href="/sources">
                          <Button variant="outline" size="xs" rightIcon={<ArrowRight className="w-3 h-3" />}>
                            Add source
                          </Button>
                        </Link>
                      }
                    />
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
                    <MetricLabel
                      label="Event Feed"
                      tooltip="Most recent normalized events across all sources."
                      className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider"
                    />
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
                  <MetricLabel
                    label="Severity"
                    tooltip="Event severity level"
                    className="text-[#374151] text-[9px] font-mono uppercase tracking-widest w-[56px]"
                  />
                  <MetricLabel
                    label="Source"
                    tooltip="Log source that produced the event"
                    className="text-[#374151] text-[9px] font-mono uppercase tracking-widest w-40"
                  />
                  <MetricLabel
                    label="Action"
                    tooltip="Normalized event action"
                    className="text-[#374151] text-[9px] font-mono uppercase tracking-widest flex-1"
                  />
                  <MetricLabel
                    label="Actor"
                    tooltip="User or source IP that performed the action"
                    className="text-[#374151] text-[9px] font-mono uppercase tracking-widest w-[150px] hidden xl:block"
                  />
                  <MetricLabel
                    label="Time"
                    tooltip="Original event timestamp"
                    className="text-[#374151] text-[9px] font-mono uppercase tracking-widest w-24 text-right"
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <SkeletonBlock rows={12} />
                  ) : events.length === 0 ? (
                    <EmptyState
                      title="No events yet"
                      description="Events will appear here once your sources start sending logs."
                      icon={<FileSearch className="w-8 h-8" />}
                      action={
                        <Link href="/sources">
                          <Button variant="outline" size="xs" rightIcon={<ArrowRight className="w-3 h-3" />}>
                            Configure sources
                          </Button>
                        </Link>
                      }
                    />
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
                    <MetricLabel
                      label="Processing Errors"
                      tooltip="Recent parse failures and processing exceptions."
                      className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <SkeletonBlock rows={5} />
                  ) : errors.length === 0 ? (
                    <EmptyState
                      title="No processing errors"
                      description="All events parsed and normalized successfully."
                      icon={<CheckCircle2 className="w-8 h-8 text-[#22c55e]" />}
                    />
                  ) : (
                    <ErrorStream errors={errors} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
