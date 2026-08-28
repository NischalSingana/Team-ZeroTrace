"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Server, Database, Brain, HardDrive, Filter, Activity, ServerCrash } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import { Timestamp } from "@/components/ui/timestamp";
import type { ThroughputPoint, ProcessingError, PipelineMetrics } from "@/lib/types";

// ── Throughput Chart ──────────────────────────────────────────────

interface ThroughputChartProps {
  data: ThroughputPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0d12] border border-[#1e2d3d] p-3 rounded-lg shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#3b82f6] to-[#10b981]" />
        <p className="text-[#94a3b8] text-xs font-mono mb-2 uppercase tracking-widest">{label}</p>
        <div className="flex flex-col gap-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[#e2e8f0] text-sm font-semibold w-16">
                {formatNumber(entry.value)}
              </span>
              <span className="text-[#64748b] text-[10px] font-mono uppercase tracking-widest">
                {entry.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function ThroughputChart({ data }: ThroughputChartProps) {
  return (
    <div className="w-full h-full min-h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIngest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorProcess" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" vertical={false} />
          <XAxis
            dataKey="time"
            tickFormatter={(time) => new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            stroke="#374151"
            fontSize={10}
            tickMargin={10}
            axisLine={false}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis
            stroke="#374151"
            fontSize={10}
            tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value)}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="ingested"
            name="ingested"
            stroke="#8b5cf6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorIngest)"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="processed"
            name="processed"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorProcess)"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="output"
            name="output"
            stroke="#22c55e"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorOutput)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Normalization Coverage ────────────────────────────────────────

interface NormalizationCoverageProps {
  coverage: number; // 0-1
}

export function NormalizationCoverage({ coverage }: NormalizationCoverageProps) {
  const norm = coverage * 100;
  const partial = Math.max(0, (1 - coverage) * 100 * 0.8);
  const failed = Math.max(0, (1 - coverage) * 100 * 0.2);

  return (
    <div className="flex flex-col h-full justify-center space-y-4 px-2">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[#e2e8f0] text-2xl font-bold tracking-tight">
            {norm.toFixed(1)}%
          </div>
          <div className="text-[#64748b] text-[10px] font-mono uppercase tracking-widest mt-1">
            Fully Normalized
          </div>
        </div>
      </div>

      <div className="h-3 w-full flex rounded overflow-hidden">
        <div style={{ width: `${norm}%` }} className="bg-[#22c55e] transition-all duration-1000" title={`Normalized: ${norm.toFixed(1)}%`} />
        <div style={{ width: `${partial}%` }} className="bg-[#eab308] transition-all duration-1000" title={`Partial: ${partial.toFixed(1)}%`} />
        <div style={{ width: `${failed}%` }} className="bg-[#ef4444] transition-all duration-1000" title={`Failed: ${failed.toFixed(1)}%`} />
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono">
        <div className="flex items-center gap-1.5 text-[#22c55e]">
          <div className="w-2 h-2 rounded bg-[#22c55e]" />
          Normalized
        </div>
        <div className="flex items-center gap-1.5 text-[#eab308]">
          <div className="w-2 h-2 rounded bg-[#eab308]" />
          Partial ({partial.toFixed(1)}%)
        </div>
        <div className="flex items-center gap-1.5 text-[#ef4444]">
          <div className="w-2 h-2 rounded bg-[#ef4444]" />
          Failed ({failed.toFixed(1)}%)
        </div>
      </div>
    </div>
  );
}

// ── Error Stream ──────────────────────────────────────────────────

interface ErrorStreamProps {
  errors: ProcessingError[];
}

export function ErrorStream({ errors }: ErrorStreamProps) {
  return (
    <div className="flex flex-col h-full bg-[#050709] font-mono text-[10px] overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {errors.map((err) => (
          <div
            key={err.id}
            className="flex flex-col gap-1.5 p-3 border-b border-[#1e2d3d]/50 hover:bg-[#0d1117] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[#ef4444] font-bold">ERROR</span>
                <span className="text-[#64748b]">[{err.stage}]</span>
              </div>
              <Timestamp iso={err.timestamp} className="text-[#64748b]" />
            </div>
            <div className="text-[#e2e8f0] font-medium leading-relaxed">
              {err.error}
            </div>
            <div className="text-[#374151] truncate">
              {err.source_id} {err.parser_id ? `via ${err.parser_id}` : ""} · {err.raw_preview}
            </div>
          </div>
        ))}
        {errors.length === 0 && (
          <div className="flex items-center justify-center h-full text-[#374151] italic">
            No recent processing errors
          </div>
        )}
      </div>
    </div>
  );
}

// ── System Health Block ───────────────────────────────────────────

export function SystemHealthBlock() {
  const services = [
    { name: "Kafka Ingest", icon: <Activity className="w-3 h-3" />, status: "healthy" },
    { name: "Parser Workers", icon: <Filter className="w-3 h-3" />, status: "healthy" },
    { name: "OpenSearch", icon: <Database className="w-3 h-3" />, status: "healthy" },
    { name: "PostgreSQL", icon: <Database className="w-3 h-3" />, status: "healthy" },
    { name: "MinIO Storage", icon: <HardDrive className="w-3 h-3" />, status: "healthy" },
    { name: "AI Service", icon: <Brain className="w-3 h-3" />, status: "degraded" },
  ];

  return (
    <div className="grid grid-cols-2 gap-px bg-[#1e2d3d] h-full">
      {services.map((svc) => (
        <div key={svc.name} className="flex flex-col items-center justify-center bg-[#0d1117] p-3 gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full border border-[#1e2d3d] bg-[#050709] text-[#64748b]">
            {svc.icon}
          </div>
          <div className="text-[#e2e8f0] text-[10px] font-mono text-center leading-tight">
            {svc.name}
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                svc.status === "healthy"
                  ? "bg-[#22c55e] animate-pulse"
                  : svc.status === "degraded"
                  ? "bg-[#eab308]"
                  : "bg-[#ef4444]"
              }`}
            />
            <span
              className={`text-[9px] font-mono uppercase tracking-widest ${
                svc.status === "healthy"
                  ? "text-[#22c55e]"
                  : svc.status === "degraded"
                  ? "text-[#eab308]"
                  : "text-[#ef4444]"
              }`}
            >
              {svc.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
