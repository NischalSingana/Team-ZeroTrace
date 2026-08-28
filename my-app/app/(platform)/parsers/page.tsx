"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { 
  Code2, Plus, Clock, Search, ChevronRight, Activity, X, 
  GitCommit, CheckCircle2, AlertTriangle, ArrowLeftRight, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useRouter } from "next/navigation";
import { fetchParsers } from "@/lib/services/parsers";
import type { Parser } from "@/lib/types";

export default function ParsersPage() {
  const router = useRouter();
  const [parsers, setParsers] = useState<Parser[]>([]);
  const [selectedParser, setSelectedParser] = useState<Parser | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParsers().then((data) => {
      setParsers(data);
      setLoading(false);
    });
  }, []);

  const filteredParsers = parsers.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusColor = (enabled: boolean) => {
    return enabled 
      ? "text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/30"
      : "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30";
  };

  const LifecycleStepper = ({ enabled }: { enabled: boolean }) => {
    const stages = ["Draft", "Testing", "Validated", "Active"];
    const currentIndex = enabled ? 3 : 0;

    return (
      <div className="flex items-center justify-between w-full relative pt-4 pb-2">
        <div className="absolute top-6 left-0 w-full h-[1px] bg-[#1e2d3d] -z-10" />
        <div className="absolute top-6 left-0 h-[1px] bg-[#3b82f6] -z-10 transition-all duration-500" style={{ width: `${Math.max(0, currentIndex) * 33.33}%` }} />
        
        {stages.map((stage, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          
          return (
            <div key={stage} className="flex flex-col items-center gap-2 bg-[#0a0d12] px-2">
              <div className={cn(
                "w-5 h-5 rounded-full border-[2px] flex items-center justify-center text-[9px]",
                isCompleted ? "bg-[#3b82f6] border-[#3b82f6] text-white" :
                isCurrent ? "bg-[#0a0d12] border-[#3b82f6] text-[#3b82f6]" :
                "bg-[#0a0d12] border-[#1e2d3d] text-transparent"
              )}>
                {isCompleted && <CheckCircle2 className="w-3 h-3 text-white" />}
                {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />}
              </div>
              <span className={cn(
                "text-[9px] uppercase font-bold tracking-widest font-mono",
                isCompleted ? "text-[#94a3b8]" :
                isCurrent ? "text-[#3b82f6]" :
                "text-[#374151]"
              )}>{stage}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#050709] relative overflow-hidden">
      
      <PageHeader 
        title="Parser Registry" 
        description="Version control and deployment management for platform log parsers."
        actions={
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search parsers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#0a0d12] border border-[#1e2d3d] rounded-lg pl-9 pr-4 py-1.5 text-xs text-[#e2e8f0] focus:border-[#3b82f6] outline-none transition-colors"
              />
            </div>
            <Button 
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white border-none" 
              size="sm" 
              leftIcon={<Plus className="w-3.5 h-3.5"/>}
            >
              New Parser
            </Button>
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0d12] border-b border-[#1e2d3d] sticky top-0 z-10">
                <th className="px-6 py-2.5 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono w-1/4">Parser Name</th>
                <th className="px-6 py-2.5 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono">Format</th>
                <th className="px-6 py-2.5 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono text-center">Version</th>
                <th className="px-6 py-2.5 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono text-center">Status</th>
                <th className="px-6 py-2.5 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono text-right">Type</th>
                <th className="px-6 py-2.5 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono text-right">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#1e2d3d]/50">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-3 bg-[#1e2d3d]/50 rounded animate-pulse w-3/4" />
                    </td>
                  </tr>
                ))
              ) : filteredParsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#64748b] text-sm">
                    No parsers found.
                  </td>
                </tr>
              ) : (
                filteredParsers.map(parser => (
                  <tr 
                    key={parser.id}
                    onClick={() => setSelectedParser(parser)}
                    className={cn(
                      "border-b border-[#1e2d3d]/50 cursor-pointer transition-colors group",
                      selectedParser?.id === parser.id ? "bg-[#1c2433]/50" : "hover:bg-[#0d1117]"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={selectedParser?.id === parser.id ? "text-[#e2e8f0] font-bold" : "text-[#e2e8f0] group-hover:text-white font-medium"}>
                          {parser.name}
                        </span>
                        <span className="text-[#64748b] text-[10px] font-mono mt-0.5">{parser.format}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#94a3b8] text-xs font-mono bg-[#1c2433] px-2 py-0.5 rounded border border-[#243044]">
                        {parser.format}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[#a5b4fc] text-xs font-mono font-bold">{parser.version}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase", getStatusColor(parser.enabled))}>
                        {parser.enabled ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[#94a3b8] text-xs font-mono">{parser.type}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn("text-xs font-mono font-bold", parser.accuracy > 0.99 ? "text-[#4ade80]" : parser.accuracy > 0.90 ? "text-[#eab308]" : "text-[#ef4444]")}>
                        {(parser.accuracy * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selectedParser && (
          <div className="w-[480px] bg-[#0a0d12] border-l border-[#1e2d3d] flex flex-col flex-shrink-0 shadow-2xl animate-in slide-in-from-right-8 duration-200 z-20">
            
            <div className="p-6 border-b border-[#1e2d3d] bg-gradient-to-b from-[#1c2433]/30 to-transparent relative">
              <button 
                onClick={() => setSelectedParser(null)}
                className="absolute top-4 right-4 p-1 rounded-full text-[#64748b] hover:bg-[#1e2d3d] hover:text-[#e2e8f0] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded bg-[#1c2433] border border-[#243044] flex items-center justify-center">
                  <Code2 className="w-4 h-4 text-[#3b82f6]" />
                </div>
                <h2 className="text-[#e2e8f0] text-lg font-bold tracking-tight">{selectedParser.name}</h2>
              </div>
              <p className="text-[#94a3b8] text-xs mb-6 max-w-[90%]">{selectedParser.description}</p>
              
              <LifecycleStepper enabled={selectedParser.enabled} />
              
              <div className="flex gap-2 mt-6">
                <Button 
                  className="flex-1 bg-[#3b82f6]/10 text-[#3b82f6] hover:bg-[#3b82f6]/20 border border-[#3b82f6]/30"
                  size="sm"
                  onClick={() => router.push("/parsers/studio")}
                >
                  Open in Studio
                </Button>
                <Button variant="outline" size="sm" className="px-3" title="Compare Versions">
                  <ArrowLeftRight className="w-4 h-4 text-[#94a3b8]" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              
              <div className="grid grid-cols-2 divide-x divide-y divide-[#1e2d3d] border-b border-[#1e2d3d]">
                <div className="p-4 flex flex-col items-center justify-center">
                  <span className="text-[#64748b] text-[9px] uppercase font-bold font-mono tracking-widest mb-1">Confidence Threshold</span>
                  <span className="text-[#e2e8f0] text-lg font-light font-mono">{(selectedParser.confidence_threshold * 100).toFixed(0)}%</span>
                </div>
                <div className="p-4 flex flex-col items-center justify-center">
                  <span className="text-[#64748b] text-[9px] uppercase font-bold font-mono tracking-widest mb-1">Field Mappings</span>
                  <span className="text-[#e2e8f0] text-lg font-light font-mono">{selectedParser.field_mappings.length}</span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-[#e2e8f0] text-sm font-semibold tracking-tight mb-4 flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-[#64748b]" /> Field Mappings
                </h3>
                
                <div className="space-y-2">
                  {selectedParser.field_mappings.map((fm, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#050709] border border-[#1e2d3d] rounded px-3 py-2">
                      <span className="text-[#e2e8f0] text-xs font-mono">{fm.source_field}</span>
                      <ArrowLeftRight className="w-3 h-3 text-[#64748b]" />
                      <span className="text-[#a855f7] text-xs font-mono">{fm.target_field}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
