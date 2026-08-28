"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, LayoutTemplate, Bug } from "lucide-react";
import { ConfigPane, MappingPane, Rule, Mapping, ParserStatus } from "./components";

const MOCK_RULES: Rule[] = [
  { id: "r1", type: "regex", name: "CEF Header", pattern: "^CEF:0\\\\|(?<vendor>.*?)\\\\|(?<product>.*?)\\\\|(?<version>.*?)\\\\|(?<event_id>.*?)\\\\|(?<event_name>.*?)\\\\|(?<severity>.*?)\\\\|(?<extensions>.*)$" },
  { id: "r2", type: "grok", name: "CEF Extensions", pattern: "%{KEYVALUE:cef_ext}" }
];

const MOCK_MAPPINGS: Mapping[] = [
  { source: "src", target: "source.ip", transform: "none", defaultValue: "" },
  { source: "dst", target: "destination.ip", transform: "none", defaultValue: "" },
  { source: "suser", target: "user.name", transform: "none", defaultValue: "" },
  { source: "severity", target: "event.severity", transform: "to_int", defaultValue: "" },
  { source: "event_name", target: "event.action", transform: "none", defaultValue: "" },
];

export default function ParserStudioPage() {
  const [rawLog, setRawLog] = useState("CEF:0|Cisco|Firewall|2.0|1001|Login Failed|8|src=192.168.1.50 dst=10.0.0.20 suser=admin");
  const [isTesting, setIsTesting] = useState(false);
  const [extractedFields, setExtractedFields] = useState<Record<string, string>>({});

  const handleTest = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      // Mock extraction based on the prompt's CEF example
      setExtractedFields({
        vendor: "Cisco",
        product: "Firewall",
        version: "2.0",
        event_id: "1001",
        event_name: "Login Failed",
        severity: "8",
        src: "192.168.1.50",
        dst: "10.0.0.20",
        suser: "admin"
      });
    }, 600);
  };

  return (
    <div className="flex flex-col h-full bg-[#050709] overflow-hidden">
      
      <PageHeader 
        title="Parser Studio" 
        description="Develop, test, and version log parsers in a specialized engineering environment." 
        actions={
          <div className="flex items-center gap-2">
            <Link href="/parsers">
              <Button variant="ghost" size="xs" leftIcon={<ArrowLeft className="w-3 h-3"/>}>Registry</Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden">
         
         {/* Left Pane */}
         <ConfigPane 
           rules={MOCK_RULES}
           status="draft"
           version="v1.1.0-draft"
         />

         {/* Center Pane: Editor Workspace */}
         <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117] relative">
            
            <div className="px-4 py-2 border-b border-[#1e2d3d] bg-[#121822] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-[#64748b]" />
                <span className="text-[#94a3b8] text-[10px] uppercase font-bold tracking-widest">Raw Log Workspace</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="xs" leftIcon={<Bug className="w-3.5 h-3.5"/>}>Debug Regex</Button>
              </div>
            </div>

            <div className="flex-1 p-6 flex flex-col relative overflow-hidden">
               <textarea
                 value={rawLog}
                 onChange={e => setRawLog(e.target.value)}
                 className="w-full h-[50%] bg-[#050709] border border-[#243044] rounded-lg p-4 font-mono text-sm text-[#a5b4fc] focus:border-[#3b82f6] outline-none resize-none shadow-inner leading-relaxed"
                 placeholder="Paste raw log here to test parser rules..."
               />

               {/* Simulated Extraction Highlight Overlay */}
               {Object.keys(extractedFields).length > 0 && (
                 <div className="mt-4 p-4 border border-[#22c55e]/30 bg-[#052e16]/20 rounded-lg">
                    <h4 className="text-[#4ade80] text-[10px] font-mono uppercase mb-2 font-bold flex items-center gap-1">
                      <Play className="w-3 h-3" /> Extraction Match
                    </h4>
                    <div className="font-mono text-sm leading-relaxed text-[#64748b] break-all">
                      <span className="text-[#a5b4fc]">CEF:0|</span>
                      <span className="bg-[#3b82f6]/20 text-[#60a5fa] px-1 rounded mx-px cursor-pointer hover:bg-[#3b82f6]/40" title="vendor">Cisco</span>|
                      <span className="bg-[#3b82f6]/20 text-[#60a5fa] px-1 rounded mx-px cursor-pointer hover:bg-[#3b82f6]/40" title="product">Firewall</span>|
                      <span className="bg-[#3b82f6]/20 text-[#60a5fa] px-1 rounded mx-px cursor-pointer hover:bg-[#3b82f6]/40" title="version">2.0</span>|
                      <span className="bg-[#3b82f6]/20 text-[#60a5fa] px-1 rounded mx-px cursor-pointer hover:bg-[#3b82f6]/40" title="event_id">1001</span>|
                      <span className="bg-[#8b5cf6]/20 text-[#c4b5fd] px-1 rounded mx-px cursor-pointer hover:bg-[#8b5cf6]/40" title="event_name">Login Failed</span>|
                      <span className="bg-[#eab308]/20 text-[#fde68a] px-1 rounded mx-px cursor-pointer hover:bg-[#eab308]/40" title="severity">8</span>|
                      <span className="text-[#94a3b8] ml-1">
                        src=<span className="bg-[#22c55e]/20 text-[#4ade80] px-1 rounded mx-px cursor-pointer hover:bg-[#22c55e]/40" title="src">192.168.1.50</span> 
                        dst=<span className="bg-[#22c55e]/20 text-[#4ade80] px-1 rounded mx-px cursor-pointer hover:bg-[#22c55e]/40" title="dst">10.0.0.20</span> 
                        suser=<span className="bg-[#ec4899]/20 text-[#f472b6] px-1 rounded mx-px cursor-pointer hover:bg-[#ec4899]/40" title="suser">admin</span>
                      </span>
                    </div>
                 </div>
               )}
            </div>

            <div className="p-4 border-t border-[#1e2d3d] bg-[#080b0f] flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-10">
               <span className="text-[#64748b] text-[10px] font-mono">Format: CEF</span>
               <Button 
                 variant="primary" 
                 onClick={handleTest}
                 disabled={isTesting}
                 leftIcon={isTesting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
               >
                 {isTesting ? "Executing Pipeline..." : "Test Against Sample"}
               </Button>
            </div>
         </div>

         {/* Right Pane */}
         <MappingPane 
           extractedFields={extractedFields}
           mappings={MOCK_MAPPINGS}
         />

      </div>
    </div>
  );
}
