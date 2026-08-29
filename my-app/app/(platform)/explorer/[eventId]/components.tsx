"use client";

import { useState } from "react";
import type { NormalizedEvent, LineageStep } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import {
  CheckCircle2, AlertTriangle, XCircle,
  ArrowRight, SearchCode, Database, BrainCircuit, Box, ShieldCheck, Cpu
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── 1. Horizontal Timeline ───────────────────────────────────────

const STAGE_CONFIG: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  ingest: { label: "Ingest", color: "#8b5cf6", icon: Box },
  format_detection: { label: "Detection", color: "#06b6d4", icon: SearchCode },
  parser_match: { label: "Parser", color: "#3b82f6", icon: Cpu },
  field_extraction: { label: "Extraction", color: "#3b82f6", icon: Cpu },
  normalization: { label: "Normalization", color: "#22c55e", icon: BrainCircuit },
  schema_validation: { label: "Validation", color: "#22c55e", icon: ShieldCheck },
  enrichment: { label: "Enrichment", color: "#eab308", icon: Database },
  storage: { label: "Storage", color: "#f97316", icon: Database },
};

export function ForensicTimeline({ lineage }: { lineage: LineageStep[] }) {
  // Ensure we have a standard sequence to show visually, even if actual lineage has gaps, 
  // but for forensic accuracy we just render what we actually have in the event.
  return (
    <div className="w-full overflow-x-auto bg-[#050709] border-b border-[#1e2d3d] p-6 pb-8 hide-scrollbar">
      <div className="flex items-start min-w-max">
        {lineage.map((step, i) => {
          const cfg = STAGE_CONFIG[step.stage] ?? { label: step.stage, color: "#64748b", icon: Box };
          const Icon = cfg.icon;
          const isLast = i === lineage.length - 1;
          
          return (
            <div key={i} className="flex items-center">
              
              {/* Node */}
              <div className="relative group cursor-pointer flex flex-col items-center">
                <div 
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center border-2 shadow-lg transition-transform group-hover:scale-110 z-10",
                    step.status === 'success' ? "bg-[#0d1117]" : step.status === 'warning' ? "bg-[#3a2f00]" : "bg-[#450a0a]"
                  )}
                  style={{ borderColor: step.status === 'success' ? cfg.color : undefined }}
                >
                  <Icon className="w-4 h-4" style={{ color: step.status === 'success' ? cfg.color : step.status === 'warning' ? "#fde68a" : "#fca5a5" }} />
                  
                  {/* Status Indicator */}
                  <div className="absolute -top-1.5 -right-1.5 bg-[#050709] rounded-full">
                    {step.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />}
                    {step.status === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-[#eab308]" />}
                    {step.status === 'error' && <XCircle className="w-3.5 h-3.5 text-[#ef4444]" />}
                  </div>
                </div>
                
                {/* Text underneath */}
                <div className="absolute top-12 flex flex-col items-center w-24 text-center">
                  <span className="text-[10px] font-bold text-[#e2e8f0] uppercase tracking-wider">{cfg.label}</span>
                  <span className="text-[9px] font-mono text-[#64748b]">{step.duration_ms}ms</span>
                </div>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div className="w-16 h-0.5 bg-[#1e2d3d] mx-2 relative -translate-y-4">
                   <div 
                     className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent to-[#3b82f6] opacity-50"
                     style={{ width: '100%' }}
                   />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 2. Mapping Canvas ────────────────────────────────────────────

// We mock some mapping rules based on standard field names for the demo.
function generateMappingRule(key: string, parserId: string) {
  if (key.includes("ip")) return { original: `src_ip`, rule: "Regex Extract (IPv4/IPv6)", conf: 0.99, parser: parserId };
  if (key.includes("port")) return { original: `s_port`, rule: "Typecast (Integer)", conf: 1.0, parser: parserId };
  if (key === "action") return { original: `act`, rule: "Dictionary Map (Action)", conf: 0.95, parser: parserId };
  if (key === "outcome") return { original: `res`, rule: "Heuristic Map (Status Code)", conf: 0.88, parser: parserId };
  if (key.includes("user")) return { original: `suser`, rule: "Direct Assignment", conf: 1.0, parser: parserId };
  if (key === "source_name") return { original: `device_name`, rule: "Direct Assignment", conf: 1.0, parser: parserId };
  return { original: `raw_${key}`, rule: "Dynamic Extraction", conf: 0.85, parser: parserId };
}

export function MappingCanvas({ event }: { event: NormalizedEvent }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Flatten the schema into displayable rows
  const normalizedKeys = Object.keys(event).filter(k => 
    !["id", "raw_preview", "raw_format", "raw_ref", "lineage", "extra_fields", "ai_assistance", "downstream"].includes(k)
  );

  const selectedRule = selectedKey ? generateMappingRule(selectedKey, event.parser_id) : null;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d1117]">
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#1e2d3d] bg-[#050709]">
        <h2 className="text-[#e2e8f0] text-sm font-semibold tracking-tight">Forensic Field Mapping</h2>
        <span className="text-[#64748b] text-[10px] font-mono">Select a normalized field to trace its origin</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Pane 1: Raw Payload */}
        <div className="w-1/3 border-r border-[#1e2d3d] flex flex-col relative overflow-hidden bg-[#0a0d12]">
          <div className="px-4 py-2 border-b border-[#1e2d3d] bg-[#121822] flex items-center justify-between shadow-sm z-10">
            <span className="text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold">1. Original Payload</span>
            <span className="text-[#64748b] text-[9px] font-mono">{event.raw_format}</span>
          </div>
          
          <div className="flex-1 p-6 overflow-auto text-[11px] font-mono leading-loose text-[#94a3b8] whitespace-pre-wrap selection:bg-[#3b82f6]/30">
            {/* We highlight the 'original' word in the raw payload if selected */}
            {selectedRule ? (
               event.raw_preview.split(selectedRule.original).map((part, i, arr) => (
                 <span key={i}>
                   {part}
                   {i < arr.length - 1 && (
                     <span className="bg-[#3b82f6]/20 text-[#60a5fa] font-bold px-1 rounded animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                       {selectedRule.original}
                     </span>
                   )}
                 </span>
               ))
            ) : (
               event.raw_preview
            )}
          </div>
        </div>

        {/* Pane 2: Mapping Rule Inspector (Center) */}
        <div className="w-1/3 flex flex-col bg-[#0d1117] relative">
          
          <div className="px-4 py-2 border-b border-[#1e2d3d] bg-[#121822] flex items-center justify-between shadow-sm z-10">
            <span className="text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold">2. Extraction Logic</span>
          </div>

          <div className="flex-1 p-6 flex flex-col items-center justify-center">
            {selectedRule && selectedKey ? (
              <div className="w-full max-w-sm animate-in zoom-in-95 duration-200">
                <div className="bg-[#1c2433] border border-[#243044] rounded-xl shadow-2xl p-5 relative overflow-hidden">
                  
                  {/* Glowing background orb */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#3b82f6]/10 rounded-full blur-2xl" />

                  <div className="flex items-center justify-between mb-6 relative">
                     <div className="text-center">
                        <div className="text-[#64748b] text-[9px] font-mono mb-1 uppercase">Source</div>
                        <div className="text-[#60a5fa] text-xs font-mono font-bold bg-[#3b82f6]/10 px-2 py-1 rounded">{selectedRule.original}</div>
                     </div>
                     <ArrowRight className="w-4 h-4 text-[#374151]" />
                     <div className="text-center">
                        <div className="text-[#64748b] text-[9px] font-mono mb-1 uppercase">Target</div>
                        <div className="text-[#4ade80] text-xs font-mono font-bold bg-[#22c55e]/10 px-2 py-1 rounded">{selectedKey}</div>
                     </div>
                  </div>

                  <div className="space-y-3 relative border-t border-[#1e2d3d] pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[#64748b] text-[10px] font-mono">Rule</span>
                      <span className="text-[#e2e8f0] text-[10px] font-mono bg-[#0d1117] px-2 py-0.5 rounded border border-[#1e2d3d]">{selectedRule.rule}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#64748b] text-[10px] font-mono">Parser</span>
                      <span className="text-[#e2e8f0] text-[10px] font-mono">{selectedRule.parser}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#64748b] text-[10px] font-mono">Confidence</span>
                      <span className="text-[#86efac] text-[10px] font-mono font-bold bg-[#052e16] px-1.5 py-0.5 rounded">{(selectedRule.conf * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div className="text-center text-[#374151] flex flex-col items-center">
                 <SearchCode className="w-12 h-12 mb-3 opacity-20" />
                 <p className="text-sm">Select a normalized field to view extraction logic</p>
              </div>
            )}
          </div>
        </div>

        {/* Pane 3: Normalized Schema */}
        <div className="w-1/3 border-l border-[#1e2d3d] flex flex-col bg-[#050709]">
          <div className="px-4 py-2 border-b border-[#1e2d3d] bg-[#121822] flex items-center justify-between shadow-sm z-10">
            <span className="text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold">3. Normalized Event</span>
            <span className="text-[#22c55e] text-[9px] font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Valid Schema
            </span>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-1">
             {normalizedKeys.map((key) => {
               const val = (event as unknown as Record<string, unknown>)[key];
               if (typeof val === 'object' && val !== null) {
                  // Render sub-keys for actors/targets
                  return (
                    <div key={key} className="pl-2 border-l-2 border-[#1e2d3d] ml-1 mb-2">
                      <div className="text-[#64748b] text-[10px] font-mono mb-1">{key}:</div>
                      {Object.keys(val).map(subKey => {
                        const fullKey = `${key}.${subKey}`;
                        const isSelected = selectedKey === fullKey;
                        return (
                          <div 
                            key={fullKey}
                            onClick={() => setSelectedKey(isSelected ? null : fullKey)}
                            className={cn(
                              "flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-all border font-mono text-[11px] mb-0.5",
                              isSelected 
                                ? "bg-[#1c2433] border-[#3b82f6] text-[#e2e8f0] shadow-md ml-2" 
                                : "bg-[#0d1117] border-transparent hover:border-[#1e2d3d] text-[#94a3b8] hover:text-[#e2e8f0]"
                            )}
                          >
                            <span className={isSelected ? "text-[#3b82f6] font-bold" : ""}>{subKey}</span>
                            <span className="truncate max-w-[150px] text-right opacity-80">{String((val as Record<string, unknown>)[subKey])}</span>
                          </div>
                        )
                      })}
                    </div>
                  );
               } else {
                 const isSelected = selectedKey === key;
                 return (
                   <div 
                     key={key}
                     onClick={() => setSelectedKey(isSelected ? null : key)}
                     className={cn(
                       "flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all border font-mono text-[11px]",
                       isSelected 
                         ? "bg-[#1c2433] border-[#3b82f6] text-[#e2e8f0] shadow-md ml-2" 
                         : "bg-[#0d1117] border-[#1e2d3d]/50 hover:border-[#1e2d3d] text-[#94a3b8] hover:text-[#e2e8f0]"
                     )}
                   >
                     <span className={isSelected ? "text-[#3b82f6] font-bold" : ""}>{key}</span>
                     <span className="truncate max-w-[150px] text-right opacity-80">{String(val)}</span>
                   </div>
                 );
               }
             })}
          </div>
        </div>

      </div>
    </div>
  );
}
