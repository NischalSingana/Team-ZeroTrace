"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { 
  Play, RotateCcw, MonitorPlay, ChevronRight, CheckCircle2,
  FileCode2, Database, Crosshair, ArrowRight, Zap, Loader2
} from "lucide-react";
import { SCENARIOS, Scenario } from "./data";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { fetchJson } from "@/lib/services/api";

export default function DemoConsolePage() {
  const router = useRouter();
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const handleRunScenario = () => {
    router.push(selectedScenario.route);
  };

  const handleSeedData = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const result = await fetchJson<{ seeded: { events: number; sources: number; parsers: number } }>("/api/demo/seed", { method: "POST" });
      setSeedResult(`Seeded ${result.seeded.events} events, ${result.seeded.sources} sources, ${result.seeded.parsers} parsers.`);
    } catch (err) {
      setSeedResult(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050709] overflow-hidden">
      
      <PageHeader 
        title="SIH Demonstration Console" 
        description="Director control panel for deterministic presentation scenarios."
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              leftIcon={seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              className="text-[#eab308] border-[#eab308]/30 hover:bg-[#eab308]/10"
              onClick={handleSeedData}
              disabled={seeding}
            >
              {seeding ? "Seeding..." : "Seed Demo Data"}
            </Button>
            <Button variant="outline" size="sm" leftIcon={<RotateCcw className="w-3.5 h-3.5" />} className="text-[#f97316] border-[#f97316]/30 hover:bg-[#f97316]/10">
              Reset Demo State
            </Button>
          </div>
        }
      />

      {seedResult && (
        <div className="px-6 py-2 bg-[#052e16]/20 border-b border-[#22c55e]/20 text-[#4ade80] text-xs font-mono">
          {seedResult}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        
        <div className="w-[320px] bg-[#0a0d12] border-r border-[#1e2d3d] flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b border-[#1e2d3d] bg-[#080b0f]">
            <span className="text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono flex items-center gap-2">
              <MonitorPlay className="w-3.5 h-3.5" /> Presentation Script
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between group transition-colors",
                  selectedScenario.id === scenario.id 
                    ? "bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6]" 
                    : "border border-transparent text-[#94a3b8] hover:bg-[#1c2433] hover:text-[#e2e8f0]"
                )}
              >
                <span className="text-sm font-semibold tracking-tight">{scenario.title}</span>
                <ChevronRight className={cn("w-4 h-4", selectedScenario.id === scenario.id ? "text-[#3b82f6]" : "text-[#64748b] group-hover:text-[#e2e8f0]")} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-[#050709] overflow-y-auto p-8 flex justify-center">
          <div className="max-w-[800px] w-full flex flex-col gap-8">
            
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-center">
                  <MonitorPlay className="w-5 h-5 text-[#3b82f6]" />
                </div>
                <h2 className="text-[#e2e8f0] text-2xl font-bold tracking-tight">{selectedScenario.title}</h2>
              </div>
              <p className="text-[#94a3b8] text-base">{selectedScenario.objective}</p>
            </div>

            <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded-xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#1c2433]" />
              
              <div className="flex flex-col md:flex-row items-center gap-6 text-center">
                
                <div className="flex-1 w-full bg-[#050709] border border-[#1e2d3d] rounded-lg p-5">
                  <FileCode2 className="w-6 h-6 text-[#94a3b8] mx-auto mb-3" />
                  <h4 className="text-[#e2e8f0] text-sm font-bold mb-3">Input</h4>
                  <ul className="text-[#64748b] text-xs font-mono text-left space-y-2">
                    {selectedScenario.input.map((inp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#3b82f6] mt-0.5">•</span> {inp}
                      </li>
                    ))}
                  </ul>
                </div>

                <ArrowRight className="w-8 h-8 text-[#1e2d3d] flex-shrink-0" />

                <div className="flex-1 w-full bg-[#1c2433]/30 border border-[#3b82f6]/30 rounded-lg p-5 relative">
                  <div className="absolute -inset-px bg-gradient-to-r from-[#3b82f6]/20 to-[#a855f7]/20 rounded-lg opacity-20" />
                  <Crosshair className="w-6 h-6 text-[#3b82f6] mx-auto mb-3" />
                  <h4 className="text-[#3b82f6] text-sm font-bold mb-3">Processing</h4>
                  <p className="text-[#94a3b8] text-xs leading-relaxed">{selectedScenario.processing}</p>
                </div>

                <ArrowRight className="w-8 h-8 text-[#1e2d3d] flex-shrink-0" />

                <div className="flex-1 w-full bg-[#050709] border border-[#1e2d3d] rounded-lg p-5">
                  <Database className="w-6 h-6 text-[#4ade80] mx-auto mb-3" />
                  <h4 className="text-[#e2e8f0] text-sm font-bold mb-3">Output</h4>
                  <p className="text-[#94a3b8] text-xs leading-relaxed">{selectedScenario.output}</p>
                </div>

              </div>
            </div>

            <div className="bg-[#4ade80]/5 border border-[#4ade80]/20 rounded-xl p-6">
              <h3 className="text-[#4ade80] text-sm font-bold tracking-tight mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Success Criteria
              </h3>
              <p className="text-[#e2e8f0] text-sm leading-relaxed">{selectedScenario.successCriteria}</p>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#1e2d3d]">
              <Button 
                onClick={handleRunScenario}
                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-8 h-12 text-base font-semibold border-none shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all"
                leftIcon={<Play className="w-5 h-5 fill-current" />}
              >
                Run Scenario
              </Button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
