"use client";

import { cn } from "@/lib/utils/cn";
import {
  GitCommit, FileJson, ArrowRight, GitBranch,
  Plus, Save, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Shared Types ──────────────────────────────────────────────────

export type ParserStatus = "draft" | "testing" | "validated" | "active";

export type Rule = {
  id: string;
  type: "regex" | "grok" | "json_path" | "transform";
  name: string;
  pattern: string;
};

export type Mapping = {
  source: string;
  target: string;
  transform: "none" | "to_string" | "to_int" | "to_date" | "lowercase";
  defaultValue: string;
};

// ── Left Pane: Configuration ──────────────────────────────────────

export function ConfigPane({ 
  rules, 
  status, 
  version 
}: { 
  rules: Rule[], 
  status: ParserStatus,
  version: string 
}) {
  return (
    <div className="w-[350px] border-r border-[#1e2d3d] bg-[#0a0d12] flex flex-col h-full flex-shrink-0">
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e2d3d] bg-[#080b0f] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#64748b]" />
          <h2 className="text-[#e2e8f0] text-sm font-semibold tracking-tight">Configuration</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#64748b] text-[10px] font-mono">{version}</span>
          <span className={cn(
            "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase",
            status === "draft" ? "bg-[#1c2433] text-[#94a3b8] border border-[#243044]" :
            status === "active" ? "bg-[#052e16] text-[#4ade80] border border-[#22c55e]/30" :
            "bg-[#3a2f00] text-[#fde68a] border border-[#eab308]/30"
          )}>
            {status}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Extraction Stages */}
        <div>
           <div className="flex items-center justify-between mb-3">
             <h3 className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest">Extraction Stages</h3>
             <Button variant="ghost" size="xs" className="px-1"><Plus className="w-3.5 h-3.5" /></Button>
           </div>
           
           <div className="space-y-2">
             {rules.map((rule, idx) => (
               <div key={rule.id} className="bg-[#0d1117] border border-[#1e2d3d] rounded p-3 cursor-pointer hover:border-[#3b82f6] transition-colors group">
                 <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#3b82f6] text-[10px] font-mono font-bold">{idx + 1}.</span>
                      <span className="text-[#e2e8f0] text-xs font-mono">{rule.name}</span>
                    </div>
                    <span className="text-[#64748b] text-[9px] font-mono uppercase bg-[#1c2433] px-1.5 py-px rounded">{rule.type}</span>
                 </div>
                 <div className="text-[#a5b4fc] text-[10px] font-mono truncate bg-[#050709] border border-[#1e2d3d]/50 p-1 rounded group-hover:border-[#3b82f6]/30">
                    {rule.pattern}
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Post Processing */}
        <div>
           <div className="flex items-center justify-between mb-3">
             <h3 className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest">Post Processing</h3>
             <Button variant="ghost" size="xs" className="px-1"><Plus className="w-3.5 h-3.5" /></Button>
           </div>
           
           <div className="bg-[#0d1117] border border-[#1e2d3d] rounded p-3 border-dashed flex flex-col items-center justify-center text-[#64748b] gap-2 py-6 cursor-pointer hover:border-[#3b82f6] transition-colors hover:text-[#e2e8f0]">
             <GitCommit className="w-5 h-5" />
             <span className="text-[10px] font-mono">Add transformation rule</span>
           </div>
        </div>

      </div>
      
      <div className="p-4 border-t border-[#1e2d3d] bg-[#050709]">
        <Button variant="primary" className="w-full" leftIcon={<Save className="w-4 h-4"/>}>Save Revision</Button>
      </div>
    </div>
  );
}

// ── Right Pane: Mappings ──────────────────────────────────────────

export function MappingPane({ 
  extractedFields, 
  mappings 
}: { 
  extractedFields: Record<string, string>,
  mappings: Mapping[] 
}) {
  return (
    <div className="w-[450px] border-l border-[#1e2d3d] bg-[#0a0d12] flex flex-col h-full flex-shrink-0">
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e2d3d] bg-[#080b0f] flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-[#8b5cf6]" />
        <h2 className="text-[#e2e8f0] text-sm font-semibold tracking-tight">Schema Mapping</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Extracted Tokens */}
        <div>
           <h3 className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest mb-3">Detected Tokens</h3>
           {Object.keys(extractedFields).length === 0 ? (
             <div className="text-[#64748b] text-xs font-mono text-center py-4 border border-[#1e2d3d] border-dashed rounded">No tokens extracted yet. Run a test.</div>
           ) : (
             <div className="grid grid-cols-2 gap-2">
               {Object.entries(extractedFields).map(([k, v]) => (
                 <div key={k} className="bg-[#1c2433]/50 border border-[#243044] rounded p-2 flex flex-col gap-1 hover:border-[#8b5cf6]/50 transition-colors cursor-pointer group">
                   <div className="text-[#8b5cf6] text-[10px] font-mono font-bold">{k}</div>
                   <div className="text-[#94a3b8] text-[10px] font-mono truncate group-hover:text-[#e2e8f0]">{v}</div>
                 </div>
               ))}
             </div>
           )}
        </div>

        {/* Visual Mappings */}
        <div>
           <div className="flex items-center justify-between mb-3">
             <h3 className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest">Active Mappings</h3>
             <Button variant="ghost" size="xs" className="px-1"><Plus className="w-3.5 h-3.5" /></Button>
           </div>
           
           <div className="space-y-2">
             {mappings.map((m, i) => (
               <div key={i} className="flex items-center gap-2 p-2 bg-[#0d1117] border border-[#1e2d3d] rounded-lg">
                  <div className="flex-1 min-w-0 bg-[#050709] border border-[#243044] p-1.5 rounded">
                    <div className="text-[#64748b] text-[8px] font-mono uppercase mb-0.5">Source Key</div>
                    <div className="text-[#e2e8f0] text-[10px] font-mono font-bold truncate">{m.source}</div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center w-12 flex-shrink-0">
                    <ArrowRight className="w-3 h-3 text-[#3b82f6] mb-1" />
                    {m.transform !== "none" && (
                      <span className="text-[8px] font-mono text-[#3b82f6] uppercase tracking-wider">{m.transform}</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 bg-[#052e16]/30 border border-[#22c55e]/30 p-1.5 rounded">
                    <div className="text-[#64748b] text-[8px] font-mono uppercase mb-0.5">Universal Key</div>
                    <div className="text-[#4ade80] text-[10px] font-mono font-bold truncate">{m.target}</div>
                  </div>
               </div>
             ))}
           </div>
        </div>

      </div>

      {/* Normalized Output Preview */}
      <div className="h-1/3 border-t border-[#1e2d3d] bg-[#050709] flex flex-col">
         <div className="px-4 py-2 border-b border-[#1e2d3d] bg-[#080b0f] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#22c55e]">
              <FileJson className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Normalized Output</span>
            </div>
         </div>
         <div className="flex-1 overflow-auto p-4 text-[11px] font-mono text-[#e2e8f0]">
           {Object.keys(extractedFields).length > 0 ? (
             <pre>
{`{
  "timestamp": "${new Date().toISOString()}",
  "source.ip": "${extractedFields.src || '192.168.1.50'}",
  "destination.ip": "${extractedFields.dst || '10.0.0.20'}",
  "user.name": "${extractedFields.suser || 'admin'}",
  "event.severity": "${extractedFields.severity || '8'}",
  "event.action": "${extractedFields.event_name || 'Login Failed'}"
}`}
             </pre>
           ) : (
             <div className="h-full flex items-center justify-center text-[#64748b] italic">Run a test to preview JSON.</div>
           )}
         </div>
      </div>
    </div>
  );
}
