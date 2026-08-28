"use client";

import { useState } from "react";
import Link from "next/link";
import { Timestamp } from "@/components/ui/timestamp";
import { SeverityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NormalizedEvent } from "@/lib/types";
import { 
  X, Copy, Download, RotateCcw, Box, FileJson, FileCode2,
  GitCommit, Activity, BrainCircuit, ExternalLink, ChevronRight, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ── JSON Tree Component ──────────────────────────────────────────

function JsonNode({ label, value, isLast, expanded = true }: { label: string, value: unknown, isLast: boolean, expanded?: boolean }) {
  const [isOpen, setIsOpen] = useState(expanded);
  
  if (value === null) {
    return (
      <div className="flex font-mono text-[10px] leading-relaxed">
        <span className="text-[#64748b] mr-2">&quot;{label}&quot;:</span>
        <span className="text-[#fca5a5]">null</span>
        {!isLast && <span className="text-[#64748b]">,</span>}
      </div>
    );
  }
  
  if (typeof value === "string") {
    return (
      <div className="flex font-mono text-[10px] leading-relaxed">
        <span className="text-[#64748b] mr-2">&quot;{label}&quot;:</span>
        <span className="text-[#86efac]">&quot;{value}&quot;</span>
        {!isLast && <span className="text-[#64748b]">,</span>}
      </div>
    );
  }
  
  if (typeof value === "number" || typeof value === "boolean") {
    return (
      <div className="flex font-mono text-[10px] leading-relaxed">
        <span className="text-[#64748b] mr-2">&quot;{label}&quot;:</span>
        <span className="text-[#93c5fd]">{String(value)}</span>
        {!isLast && <span className="text-[#64748b]">,</span>}
      </div>
    );
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <div className="flex font-mono text-[10px] leading-relaxed">
          <span className="text-[#64748b] mr-2">&quot;{label}&quot;:</span>
          <span className="text-[#e2e8f0]">[]</span>
          {!isLast && <span className="text-[#64748b]">,</span>}
        </div>
      );
    }
    return (
      <div className="font-mono text-[10px] leading-relaxed">
        <div 
          className="flex cursor-pointer hover:bg-[#1e2d3d]/50 w-fit pr-2 rounded transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronDown className="w-3 h-3 text-[#64748b] mt-0.5 mr-1" /> : <ChevronRight className="w-3 h-3 text-[#64748b] mt-0.5 mr-1" />}
          <span className="text-[#64748b] mr-2">&quot;{label}&quot;:</span>
          <span className="text-[#e2e8f0]">[</span>
          {!isOpen && <span className="text-[#64748b]"> {value.length} items ]{!isLast && ","}</span>}
        </div>
        {isOpen && (
          <div className="pl-6 border-l border-[#243044] ml-1.5 my-0.5">
            {value.map((item, i) => (
              <div key={i}>
                <JsonNode label={String(i)} value={item} isLast={i === value.length - 1} expanded={false} />
              </div>
            ))}
          </div>
        )}
        {isOpen && <div className="ml-4 text-[#e2e8f0]">]{!isLast && <span className="text-[#64748b]">,</span>}</div>}
      </div>
    );
  }
  
  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return (
        <div className="flex font-mono text-[10px] leading-relaxed">
          <span className="text-[#64748b] mr-2">&quot;{label}&quot;:</span>
          <span className="text-[#e2e8f0]">{`{}`}</span>
          {!isLast && <span className="text-[#64748b]">,</span>}
        </div>
      );
    }
    return (
      <div className="font-mono text-[10px] leading-relaxed">
        <div 
          className="flex cursor-pointer hover:bg-[#1e2d3d]/50 w-fit pr-2 rounded transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronDown className="w-3 h-3 text-[#64748b] mt-0.5 mr-1" /> : <ChevronRight className="w-3 h-3 text-[#64748b] mt-0.5 mr-1" />}
          <span className="text-[#64748b] mr-2">&quot;{label}&quot;:</span>
          <span className="text-[#e2e8f0]">{`{`}</span>
          {!isOpen && <span className="text-[#64748b]"> {keys.length} keys {'}'}{!isLast && ","}</span>}
        </div>
        {isOpen && (
          <div className="pl-6 border-l border-[#243044] ml-1.5 my-0.5">
            {keys.map((k, i) => (
              <JsonNode key={k} label={k} value={(value as Record<string, unknown>)[k]} isLast={i === keys.length - 1} expanded={expanded} />
            ))}
          </div>
        )}
        {isOpen && <div className="ml-4 text-[#e2e8f0]">{'}'}{!isLast && <span className="text-[#64748b]">,</span>}</div>}
      </div>
    );
  }
  
  return null;
}

// ── Inspector Split Pane ─────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview", icon: Box },
  { id: "normalized", label: "Normalized", icon: FileJson },
  { id: "original", label: "Original", icon: FileCode2 },
  { id: "lineage", label: "Lineage", icon: GitCommit },
];

export function EventInspectorPane({
  event,
  onClose,
}: {
  event: NormalizedEvent | null;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!event) return null;

  return (
    <div className="w-[500px] xl:w-[650px] border-l border-[#1e2d3d] bg-[#080b0f] flex flex-col h-full flex-shrink-0 animate-in slide-in-from-right-8 duration-200 shadow-2xl z-20">
      
      {/* Header Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2d3d] bg-[#0d1117]">
        <div className="flex items-center gap-3">
           <SeverityBadge severity={event.severity} size="sm" />
           <span className="text-[#e2e8f0] text-sm font-mono font-medium truncate max-w-[200px]">{event.id}</span>
        </div>
        <div className="flex items-center gap-1">
          <Link href={`/explorer/${event.id}`}>
            <Button variant="ghost" size="xs" leftIcon={<ExternalLink className="w-3 h-3"/>}>Full Lineage</Button>
          </Link>
          <div className="w-px h-4 bg-[#1e2d3d] mx-1" />
          <Button variant="ghost" size="xs" leftIcon={<Copy className="w-3 h-3"/>}>Copy ID</Button>
          <Button variant="ghost" size="xs" leftIcon={<Download className="w-3 h-3"/>}>Export</Button>
          <Button variant="ghost" size="xs" leftIcon={<RotateCcw className="w-3 h-3"/>}>Replay</Button>
          <div className="w-px h-4 bg-[#1e2d3d] mx-1" />
          <Button variant="ghost" size="xs" onClick={onClose} className="px-1.5"><X className="w-4 h-4"/></Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 px-4 border-b border-[#1e2d3d] bg-[#050709] overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 py-3 text-[10px] font-mono uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap",
                active ? "border-[#3b82f6] text-[#e2e8f0]" : "border-transparent text-[#64748b] hover:text-[#94a3b8]"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#050709]">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0d1117] border border-[#1e2d3d] rounded p-3">
                <div className="text-[#64748b] text-[9px] font-mono uppercase tracking-widest mb-1">Source</div>
                <div className="text-[#e2e8f0] text-sm font-medium">{event.source_name}</div>
              </div>
              <div className="bg-[#0d1117] border border-[#1e2d3d] rounded p-3">
                <div className="text-[#64748b] text-[9px] font-mono uppercase tracking-widest mb-1">Timestamp</div>
                <Timestamp iso={event.timestamp} className="text-[#e2e8f0] text-sm font-medium" />
              </div>
              <div className="bg-[#0d1117] border border-[#1e2d3d] rounded p-3">
                <div className="text-[#64748b] text-[9px] font-mono uppercase tracking-widest mb-1">Action</div>
                <div className="text-[#3b82f6] text-sm font-mono font-medium">{event.action}</div>
              </div>
              <div className="bg-[#0d1117] border border-[#1e2d3d] rounded p-3">
                <div className="text-[#64748b] text-[9px] font-mono uppercase tracking-widest mb-1">Outcome</div>
                <div className={cn("text-sm font-mono font-medium", event.outcome === "success" ? "text-[#22c55e]" : "text-[#ef4444]")}>{event.outcome}</div>
              </div>
            </div>

            <div>
              <div className="text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
                <BrainCircuit className="w-3.5 h-3.5 text-[#8b5cf6]" /> AI & Parsing
              </div>
              <div className="bg-[#0d1117] border border-[#1e2d3d] rounded p-3 space-y-3">
                <div className="flex justify-between items-center border-b border-[#1e2d3d] pb-2">
                  <span className="text-[#64748b] text-[10px] font-mono">Parser Used</span>
                  <span className="text-[#e2e8f0] text-xs font-mono bg-[#1c2433] px-2 py-0.5 rounded">{event.parser_id}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#1e2d3d] pb-2">
                  <span className="text-[#64748b] text-[10px] font-mono">Format</span>
                  <span className="text-[#e2e8f0] text-xs font-mono">{event.raw_format}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#1e2d3d] pb-2">
                  <span className="text-[#64748b] text-[10px] font-mono">Confidence</span>
                  <span className="text-[#86efac] text-xs font-mono bg-[#052e16] border border-[#22c55e]/30 px-2 py-0.5 rounded">{(event.parser_confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b] text-[10px] font-mono">AI Mapping Assistance</span>
                  <span className="text-[#e2e8f0] text-xs font-mono">{event.ai_assistance ? 'Yes (Schema Generation)' : 'None'}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
                 Actors & Targets
              </div>
              <div className="bg-[#0d1117] border border-[#1e2d3d] rounded p-3 grid grid-cols-2 gap-4">
                 <div>
                   <span className="text-[#64748b] block mb-1 text-[9px] font-mono uppercase">Source IP</span>
                   <span className="text-[#e2e8f0] text-xs font-mono">{event.actor.ip ?? '—'}</span>
                 </div>
                 <div>
                   <span className="text-[#64748b] block mb-1 text-[9px] font-mono uppercase">Dest IP</span>
                   <span className="text-[#e2e8f0] text-xs font-mono">{event.target.ip ?? '—'}</span>
                 </div>
                 <div>
                   <span className="text-[#64748b] block mb-1 text-[9px] font-mono uppercase">User</span>
                   <span className="text-[#e2e8f0] text-xs font-mono">{event.actor.user ?? '—'}</span>
                 </div>
                 <div>
                   <span className="text-[#64748b] block mb-1 text-[9px] font-mono uppercase">Dest Port</span>
                   <span className="text-[#e2e8f0] text-xs font-mono">{event.target.port ?? '—'}</span>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "normalized" && (
          <div className="bg-[#0d1117] border border-[#1e2d3d] rounded p-4 overflow-x-auto min-h-full">
             <div className="text-[#e2e8f0] font-mono text-[10px] mb-2">{`{`}</div>
             <div className="pl-4 border-l border-[#243044] ml-1.5">
               {Object.keys(event).map((key, i) => (
                 <JsonNode 
                   key={key} 
                   label={key} 
                   value={(event as unknown as Record<string, unknown>)[key]}
                   isLast={i === Object.keys(event).length - 1} 
                 />
               ))}
             </div>
             <div className="text-[#e2e8f0] font-mono text-[10px] mt-2">{`}`}</div>
          </div>
        )}

        {activeTab === "original" && (
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[#64748b] text-[10px] font-mono uppercase tracking-widest">Raw Format: <span className="text-[#3b82f6]">{event.raw_format}</span></span>
              <Button variant="outline" size="xs" leftIcon={<Copy className="w-3 h-3"/>}>Copy Raw Text</Button>
            </div>
            <div className="flex-1 bg-[#0d1117] border border-[#1e2d3d] rounded p-4 text-[#a5b4fc] text-xs font-mono overflow-auto whitespace-pre-wrap leading-relaxed">
              {event.raw_preview}
            </div>
          </div>
        )}

        {activeTab === "lineage" && (
          <div className="py-4 px-2">
            <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#1e2d3d] before:to-transparent">
              {event.lineage.map((step, index) => (
                <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-6">
                  
                  {/* Icon */}
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 border-[#050709] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${step.status === 'success' ? 'bg-[#22c55e]' : step.status === 'warning' ? 'bg-[#eab308]' : 'bg-[#ef4444]'}`}>
                    {step.status === 'success' && <CheckCircle2 className="w-3 h-3 text-[#052e16]" />}
                    {step.status === 'error' && <X className="w-3 h-3 text-[#450a0a]" />}
                    {step.status === 'warning' && <Activity className="w-3 h-3 text-[#422006]" />}
                  </div>
                  
                  {/* Card */}
                  <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-lg border border-[#1e2d3d] bg-[#0d1117] shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-[#e2e8f0] text-xs uppercase tracking-wider">{step.stage.replace('_', ' ')}</div>
                      <time className="font-mono text-[10px] text-[#64748b] bg-[#1c2433] px-2 py-0.5 rounded">{step.duration_ms}ms</time>
                    </div>
                    <div className="text-[#94a3b8] text-[11px] leading-relaxed">
                      {step.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckCircle2(props: React.ComponentProps<"svg">) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
}
