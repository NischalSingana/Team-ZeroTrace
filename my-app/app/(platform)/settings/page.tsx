"use client";

import { PageHeader } from "@/components/layout/page-header";
import { 
  ShieldCheck, WifiOff, Cpu, Box, Database, HardDrive, 
  TerminalSquare, Download, Lock, CheckCircle2, AlertTriangle, Fingerprint, Server
} from "lucide-react";
import { DEPLOYMENT_COMPONENTS } from "./data";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

interface StatusBlockProps {
  label: string;
  value: string;
  icon: React.ElementType;
  intent?: "neutral" | "secure" | "warning";
}

const StatusBlock = ({ label, value, icon: Icon, intent = "neutral" }: StatusBlockProps) => {
  return (
    <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded-lg p-5 flex flex-col justify-between h-[120px] relative overflow-hidden group">
      {intent === "secure" && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#4ade80] to-[#10b981]" />}
      {intent === "warning" && <div className="absolute top-0 left-0 w-full h-1 bg-[#f97316]" />}
      
      <div className="flex justify-between items-start">
        <span className="text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono">{label}</span>
        <Icon className={cn("w-4 h-4", 
          intent === "secure" ? "text-[#4ade80]" : 
          intent === "warning" ? "text-[#f97316]" : 
          "text-[#94a3b8]"
        )} />
      </div>
      
      <div>
        <span className={cn("text-xl font-semibold tracking-tight block", 
          intent === "secure" ? "text-[#e2e8f0]" : 
          intent === "warning" ? "text-[#f97316]" : 
          "text-[#e2e8f0]"
        )}>
          {value}
        </span>
      </div>
    </div>
  );
};

const getCategoryIcon = (cat: string) => {
  switch(cat) {
    case "Core": return TerminalSquare;
    case "Storage": return Database;
    case "AI": return Cpu;
    case "Data": return HardDrive;
    default: return Box;
  }
};

export default function SettingsPage() {
  
  return (
    <div className="flex flex-col h-full bg-[#050709] overflow-y-auto overflow-x-hidden">
      
      <PageHeader 
        title="Deployment & Diagnostics" 
        description="Verify air-gapped environment isolation and inspect component deployment state."
        actions={
          <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
            Export Diagnostic Bundle
          </Button>
        }
      />

      <div className="p-6 max-w-[1400px] mx-auto w-full space-y-6">
        
        {/* Environment Perimeter Status */}
        <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded-lg p-6 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6 border-b border-[#1e2d3d] pb-4">
            <Lock className="w-5 h-5 text-[#4ade80]" />
            <h3 className="text-[#e2e8f0] text-sm font-semibold tracking-tight">Security Perimeter Status</h3>
            <span className="ml-auto text-[#64748b] text-[10px] font-mono">Platform ID: ULPF-SEC-992</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <StatusBlock 
              label="Environment" 
              value="AIR-GAPPED" 
              icon={ShieldCheck} 
              intent="secure"
            />
            <StatusBlock 
              label="Internet" 
              value="DISCONNECTED" 
              icon={WifiOff} 
              intent="warning"
            />
            <StatusBlock 
              label="Core Services" 
              value="HEALTHY" 
              icon={CheckCircle2} 
              intent="secure"
            />
            <StatusBlock 
              label="Local AI" 
              value="AVAILABLE" 
              icon={Cpu} 
              intent="secure"
            />
            <StatusBlock 
              label="External Deps" 
              value="NONE" 
              icon={AlertTriangle} 
              intent="neutral"
            />
          </div>
        </div>

        {/* Diagnostics Matrix Table */}
        <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded-lg overflow-hidden pb-12">
          <div className="px-6 py-4 border-b border-[#1e2d3d] bg-[#080b0f] flex items-center justify-between">
            <h3 className="text-[#e2e8f0] text-sm font-semibold tracking-tight flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-[#3b82f6]" /> Component Registry Matrix
            </h3>
            <div className="text-[10px] font-mono text-[#64748b]">All components cryptographically verified.</div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0a0d12] border-b border-[#1e2d3d]">
                  <th className="px-6 py-3 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono">Component</th>
                  <th className="px-6 py-3 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono">Deployment</th>
                  <th className="px-6 py-3 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono">Isolation</th>
                  <th className="px-6 py-3 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono">Version / Image</th>
                  <th className="px-6 py-3 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono text-right">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d3d]/50">
                {DEPLOYMENT_COMPONENTS.map((comp) => {
                  const CatIcon = getCategoryIcon(comp.category);
                  
                  return (
                    <tr key={comp.id} className="hover:bg-[#0d1117] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <CatIcon className="w-4 h-4 text-[#64748b]" />
                          <div className="flex flex-col">
                            <span className="text-[#e2e8f0] text-xs font-semibold">{comp.name}</span>
                            <span className="text-[#64748b] text-[10px] font-mono mt-0.5">{comp.category}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className="text-[#94a3b8] text-[10px] font-mono bg-[#1c2433] px-2 py-0.5 rounded border border-[#243044]">
                          {comp.deploymentTarget}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className="text-[#a5b4fc] text-[10px] font-mono flex items-center gap-1.5">
                          {comp.isolationBoundary === "Local GPU" && <Cpu className="w-3 h-3 text-[#818cf8]" />}
                          {comp.isolationBoundary === "Local" && <Server className="w-3 h-3 text-[#94a3b8]" />}
                          {comp.isolationBoundary}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[#e2e8f0] text-xs font-mono">{comp.version}</span>
                          {comp.hash && <span className="text-[#64748b] text-[9px] font-mono mt-0.5">{comp.hash}</span>}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <span className={cn("text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase", 
                          comp.state === "Running" ? "text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/30" : 
                          comp.state === "Active" ? "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30" : 
                          "text-[#a855f7] bg-[#a855f7]/10 border-[#a855f7]/30"
                        )}>
                          {comp.state}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
