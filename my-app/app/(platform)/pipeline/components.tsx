"use client";

import { useState, useEffect, useRef } from "react";
import { formatNumber, formatDuration } from "@/lib/utils/format";
import { Timestamp } from "@/components/ui/timestamp";
import { SeverityBadge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { Button } from "@/components/ui/button";
import type { NormalizedEvent, PipelineMetrics } from "@/lib/types";
import {
  Download,
  Filter,
  FileCode2,
  Database,
  CheckCircle2,
  GitCommit,
  ArrowRight,
  Zap,
  Play,
  RotateCcw,
  Activity,
  Box,
  Network
} from "lucide-react";

// ── Pipeline Canvas (Center) ──────────────────────────────────────

const STAGE_CONFIG = [
  { id: "ingest", label: "INGEST", icon: Download },
  { id: "format_detection", label: "DETECT", icon: Filter },
  { id: "parser_match", label: "PARSE", icon: FileCode2 },
  { id: "normalization", label: "NORMALIZE", icon: Network },
  { id: "schema_validation", label: "VALIDATE", icon: CheckCircle2 },
  { id: "output", label: "OUTPUT", icon: Database },
];

export function PipelineCanvas({
  metrics,
  selectedEvent,
}: {
  metrics: PipelineMetrics | null;
  selectedEvent: NormalizedEvent | null;
}) {
  return (
    <div className="flex flex-col h-full bg-[#050709]">
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-x-auto relative">
        <div className="flex items-center justify-center min-w-max gap-0 mt-8">
          {STAGE_CONFIG.map((stage, i) => {
            const Icon = stage.icon;
            const stageMetric = metrics?.stages.find((s) => s.stage === stage.id || s.stage.includes(stage.id));
            const isLast = i === STAGE_CONFIG.length - 1;
            
            // Check if this event passed through this stage successfully
            const eventPassed = selectedEvent?.lineage.some((l) => 
              (l.stage === stage.id || l.stage.includes(stage.id)) && l.status === "success"
            );
            
            const isProcessing = selectedEvent && !eventPassed && !selectedEvent?.lineage.some((l) => (l.stage === stage.id || l.stage.includes(stage.id)) && l.status === "error");
            
            const nodeColor = eventPassed ? "#22c55e" : isProcessing ? "#3b82f6" : "#374151";

            return (
              <div key={stage.id} className="flex items-center">
                {/* Node */}
                <div className="relative group flex flex-col items-center gap-3">
                  <div 
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center border-2 shadow-lg transition-all duration-300 relative z-10 ${
                      eventPassed ? "bg-[#052e16] border-[#22c55e]" : 
                      isProcessing ? "bg-[#1e3a8a] border-[#3b82f6] animate-pulse" :
                      "bg-[#0d1117] border-[#1e2d3d]"
                    }`}
                  >
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: nodeColor }} />
                    {isProcessing && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#60a5fa] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#3b82f6]"></span>
                      </span>
                    )}
                  </div>
                  <div className="text-center absolute top-20 sm:top-24 w-32 -ml-6 sm:-ml-8">
                    <div className="text-[#e2e8f0] text-[10px] sm:text-xs font-bold tracking-widest uppercase">{stage.label}</div>
                    <div className="text-[#64748b] text-[9px] font-mono mt-1">
                      {stageMetric ? `${formatNumber(stageMetric.events_per_sec)}/s` : '---'}
                    </div>
                  </div>
                </div>

                {/* Connector */}
                {!isLast && (
                  <div className="w-12 sm:w-16 lg:w-24 h-1 flex items-center relative -mt-12 sm:-mt-16 z-0">
                     {/* Static line */}
                     <div className="w-full h-0.5 bg-[#1e2d3d] absolute" />
                     {/* Animated line (only if event passed or processing next) */}
                     {(eventPassed || isProcessing) && (
                       <div className="w-full h-0.5 absolute overflow-hidden">
                         <div className="h-full bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent w-full animate-flow-fast opacity-80" />
                       </div>
                     )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend / Status bar */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-[#1e2d3d] bg-[#0d1117] flex-shrink-0">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 text-[10px] font-mono text-[#94a3b8]">
             <div className="w-2 h-2 rounded-full bg-[#22c55e]" /> Completed
           </div>
           <div className="flex items-center gap-2 text-[10px] font-mono text-[#94a3b8]">
             <div className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" /> Processing
           </div>
           <div className="flex items-center gap-2 text-[10px] font-mono text-[#94a3b8]">
             <div className="w-2 h-2 rounded-full bg-[#1e2d3d]" /> Pending
           </div>
        </div>
        <div className="text-[10px] font-mono text-[#64748b]">
          Average Latency: <span className="text-[#e2e8f0]">{formatDuration(metrics?.stages[metrics?.stages.length - 1]?.avg_latency_ms ?? 0)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Live Stream (Left) ────────────────────────────────────────────

export function LiveStream({
  events,
  selectedId,
  onSelect,
}: {
  events: NormalizedEvent[];
  selectedId: string | null;
  onSelect: (e: NormalizedEvent) => void;
}) {
  return (
    <div className="flex flex-col h-full bg-[#050709] border-r border-[#1e2d3d] w-[340px] flex-shrink-0">
      <div className="px-4 py-3 border-b border-[#1e2d3d] bg-[#0d1117]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#3b82f6]" />
            <span className="text-[#e2e8f0] text-sm font-semibold tracking-wide">
              Live Ingest
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-[#86efac] text-[9px] font-mono uppercase bg-[#052e16] px-1.5 py-0.5 rounded border border-[#22c55e]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            Streaming
          </span>
        </div>
        <div className="text-[#64748b] text-[10px] font-mono">
           {formatNumber(events.length)} events captured
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {events.map((evt) => (
          <div 
            key={evt.id}
            onClick={() => onSelect(evt)}
            className={`px-4 py-3 border-b border-[#1e2d3d]/50 cursor-pointer transition-colors ${
              selectedId === evt.id ? "bg-[#1e293b]" : "hover:bg-[#0d1117]"
            }`}
          >
            <div className="flex items-start justify-between mb-1.5">
               <SeverityBadge severity={evt.severity} size="xs" />
               <Timestamp iso={evt.processed_at} className="text-[#64748b] text-[10px]" />
            </div>
            <div className="text-[#e2e8f0] text-xs font-mono font-medium truncate mb-1">
              {evt.action}
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-[#94a3b8] truncate max-w-[120px]">
                {evt.source_name.split('—')[0]}
              </span>
              <span className="text-[#3b82f6] truncate max-w-[100px]">
                {evt.raw_format}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Event Inspector (Right) ───────────────────────────────────────

export function EventInspector({ event }: { event: NormalizedEvent | null }) {
  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-[380px] border-l border-[#1e2d3d] bg-[#050709] text-[#64748b] flex-shrink-0">
        <Box className="w-8 h-8 mb-4 opacity-50" />
        <p className="text-sm">Select an event to inspect</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-l border-[#1e2d3d] w-[380px] flex-shrink-0">
      <div className="px-4 py-3 border-b border-[#1e2d3d] flex items-center justify-between">
        <span className="text-[#e2e8f0] text-sm font-semibold tracking-wide">
          Event Inspector
        </span>
        <Button size="xs" variant="outline" leftIcon={<RotateCcw className="w-3 h-3"/>}>
          Replay
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Info */}
        <div>
           <div className="text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold mb-2">Metadata</div>
           <div className="grid grid-cols-2 gap-3 text-xs font-mono">
             <div>
               <span className="text-[#64748b] block mb-0.5 text-[9px]">ID</span>
               <span className="text-[#e2e8f0] truncate block">{event.id}</span>
             </div>
             <div>
               <span className="text-[#64748b] block mb-0.5 text-[9px]">Source</span>
               <span className="text-[#e2e8f0] truncate block">{event.source_name}</span>
             </div>
             <div>
               <span className="text-[#64748b] block mb-0.5 text-[9px]">Ingested</span>
               <Timestamp iso={event.ingested_at} className="text-[#e2e8f0]" />
             </div>
             <div>
               <span className="text-[#64748b] block mb-0.5 text-[9px]">Latency</span>
               <span className="text-[#e2e8f0]">{(new Date(event.processed_at).getTime() - new Date(event.ingested_at).getTime()).toFixed(1)}ms</span>
             </div>
           </div>
        </div>

        {/* Raw Event */}
        <div>
           <div className="flex items-center justify-between mb-2">
             <div className="text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold">1. Raw Payload</div>
             <span className="text-[#3b82f6] text-[9px] font-mono">{event.raw_format}</span>
           </div>
           <div className="bg-[#050709] border border-[#1e2d3d] rounded p-2 text-[#a5b4fc] text-[10px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
             {event.raw_preview}
           </div>
        </div>

        {/* Parsed / Normalized */}
        <div>
           <div className="flex items-center justify-between mb-2">
             <div className="text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold">2. Normalized Schema</div>
             <span className="text-[#22c55e] text-[9px] font-mono">Valid</span>
           </div>
           <div className="bg-[#050709] border border-[#1e2d3d] rounded p-2 text-[#86efac] text-[10px] font-mono overflow-x-auto">
             <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
               <span className="text-[#64748b]">action:</span><span>{event.action}</span>
               <span className="text-[#64748b]">category:</span><span>{event.category}</span>
               <span className="text-[#64748b]">outcome:</span><span>{event.outcome}</span>
               <span className="text-[#64748b]">actor.user:</span><span>{event.actor.user ?? 'null'}</span>
               <span className="text-[#64748b]">actor.ip:</span><span>{event.actor.ip ?? 'null'}</span>
               <span className="text-[#64748b]">target.port:</span><span>{event.target.port ?? 'null'}</span>
             </div>
           </div>
        </div>

        {/* Lineage */}
        <div>
           <div className="text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold mb-2">3. Processing Lineage</div>
           <div className="space-y-3 pl-2 border-l border-[#1e2d3d] ml-1">
             {event.lineage.map((step, i) => (
               <div key={i} className="relative pl-4">
                 <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ${step.status === 'success' ? 'bg-[#22c55e]' : step.status === 'warning' ? 'bg-[#eab308]' : 'bg-[#ef4444]'}`} />
                 <div className="flex items-center justify-between">
                    <span className="text-[#e2e8f0] text-[10px] font-bold uppercase tracking-wider">{step.stage.replace('_', ' ')}</span>
                    <span className="text-[#64748b] text-[9px] font-mono">{step.duration_ms}ms</span>
                 </div>
                 <div className="text-[#94a3b8] text-[10px] mt-0.5 leading-snug">
                   {step.detail}
                 </div>
               </div>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
}
