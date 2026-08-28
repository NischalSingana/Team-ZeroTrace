"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, ArrowLeft, CheckCircle2, Server, Globe, FileText, 
  Activity, Check, BrainCircuit, Play, ShieldCheck, SearchCode, Cpu
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useRouter } from "next/navigation";

const STEPS = [
  "Information", "Transport", "Format", "Sample Log", 
  "Detection", "Mapping", "Validation", "Activate"
];

const TRANSPORTS = [
  { id: "syslog_udp", name: "Syslog UDP", icon: Server },
  { id: "syslog_tcp", name: "Syslog TCP", icon: Server },
  { id: "rest", name: "REST API", icon: Globe },
  { id: "file", name: "File Tail", icon: FileText },
  { id: "kafka", name: "Kafka Topic", icon: Activity },
];

const FORMATS = [
  { id: "auto", name: "Auto Detect (AI)", recommended: true },
  { id: "json", name: "JSON Lines" },
  { id: "syslog", name: "Syslog (RFC 3164/5424)" },
  { id: "cef", name: "CEF (Common Event Format)" },
  { id: "leef", name: "LEEF (Log Event Extended Format)" },
  { id: "csv", name: "CSV / Delimited" },
  { id: "xml", name: "XML" },
  { id: "custom", name: "Custom Regex" },
];

const UNIVERSAL_SCHEMA_FIELDS = [
  "timestamp", "event.action", "event.outcome", "source.ip", "source.port",
  "destination.ip", "destination.port", "user.name", "http.method", "http.status_code",
  "network.protocol", "file.path", "file.hash"
];

export default function NewSourceWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // State
  const [info, setInfo] = useState({ name: "", vendor: "", product: "", env: "production" });
  const [transport, setTransport] = useState("syslog_udp");
  const [format, setFormat] = useState("auto");
  const [sampleLog, setSampleLog] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedFields, setDetectedFields] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<Record<string, unknown> | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);

  // Handlers
  const handleNext = () => {
    if (step === 4 && sampleLog.trim().length > 0) {
      // Transition to detection
      setStep(5);
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        // Mock detection
        if (sampleLog.includes("{")) {
           setDetectedFields(["timestamp", "level", "src_ip", "dest_ip", "action", "status", "user"]);
           setMapping({ "src_ip": "source.ip", "dest_ip": "destination.ip", "action": "event.action", "status": "event.outcome", "user": "user.name" });
        } else {
           setDetectedFields(["date", "time", "host", "process", "msg", "src", "dst", "act"]);
           setMapping({ "src": "source.ip", "dst": "destination.ip", "act": "event.action" });
        }
      }, 1500);
    } else if (step === 6) {
      // Validation
      setStep(7);
      setIsValidating(true);
      setTimeout(() => {
        setIsValidating(false);
        setValidationResult({
           parsed: { ...mapping, timestamp: new Date().toISOString() },
           unmapped: detectedFields.filter(f => !mapping[f]),
           errors: []
        });
      }, 1200);
    } else if (step === 7) {
      setStep(8);
    } else if (step === 8) {
      setIsDeploying(true);
      setTimeout(() => {
        setIsDeploying(false);
        setDeployed(true);
      }, 2000);
    } else {
      setStep(s => Math.min(8, s + 1));
    }
  };

  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  if (deployed) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#050709] gap-6">
         <div className="w-20 h-20 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
           <CheckCircle2 className="w-10 h-10 text-[#22c55e]" />
         </div>
         <div className="text-center">
            <h1 className="text-2xl font-semibold text-[#e2e8f0] mb-2">Source Deployed Successfully</h1>
            <p className="text-[#94a3b8] font-mono text-sm max-w-md mx-auto">
               The parser has been compiled and deployed to the active pipeline. ULPF is now listening for events.
            </p>
         </div>
         
         <div className="bg-[#0d1117] border border-[#1e2d3d] rounded-lg p-6 w-[400px] space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1e2d3d] pb-2">
              <span className="text-[#64748b] text-xs font-mono uppercase">Source</span>
              <span className="text-[#e2e8f0] text-sm font-mono font-bold">{info.name || "Unnamed Source"}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[#1e2d3d] pb-2">
              <span className="text-[#64748b] text-xs font-mono uppercase">Parser Version</span>
              <span className="text-[#3b82f6] text-sm font-mono">v1.0.0-auto</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#64748b] text-xs font-mono uppercase">Status</span>
              <span className="text-[#22c55e] text-xs font-mono bg-[#052e16] px-2 py-1 rounded flex items-center gap-1">
                 <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" /> Active
              </span>
            </div>
         </div>

         <div className="flex gap-4 mt-4">
            <Button variant="outline" onClick={() => router.push("/sources")}>View All Sources</Button>
            <Button variant="primary" onClick={() => router.push("/pipeline")}>Go to Live Pipeline</Button>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#050709]">
      <PageHeader
        title="Onboard Source"
        description="Configure a new log source, detect format, and generate a parser."
        breadcrumbs={[
          { label: "Home", href: "/overview" },
          { label: "Sources", href: "/sources" },
          { label: "New Source" }
        ]}
      />

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Pane: Wizard Controls */}
        <div className="w-[450px] flex-shrink-0 border-r border-[#1e2d3d] bg-[#080b0f] flex flex-col relative z-10 shadow-2xl">
           
           {/* Steps Header */}
           <div className="px-6 py-6 border-b border-[#1e2d3d]">
              <div className="text-[#3b82f6] text-[10px] font-mono font-bold tracking-widest uppercase mb-1">
                Step {step} of 8
              </div>
              <h2 className="text-xl font-semibold text-[#e2e8f0]">{STEPS[step - 1]}</h2>
           </div>

           {/* Step Content */}
           <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
              
              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-[#94a3b8] text-[10px] uppercase font-bold tracking-widest">Source Name</label>
                    <input 
                      type="text" 
                      value={info.name}
                      onChange={e => setInfo({ ...info, name: e.target.value })}
                      placeholder="e.g., Corporate Palo Alto Firewall" 
                      className="w-full bg-[#0d1117] border border-[#243044] rounded p-2.5 text-sm text-[#e2e8f0] focus:border-[#3b82f6] outline-none transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[#94a3b8] text-[10px] uppercase font-bold tracking-widest">Vendor</label>
                      <input 
                        type="text" 
                        value={info.vendor}
                        onChange={e => setInfo({ ...info, vendor: e.target.value })}
                        placeholder="e.g., Palo Alto" 
                        className="w-full bg-[#0d1117] border border-[#243044] rounded p-2.5 text-sm text-[#e2e8f0] focus:border-[#3b82f6] outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[#94a3b8] text-[10px] uppercase font-bold tracking-widest">Product</label>
                      <input 
                        type="text" 
                        value={info.product}
                        onChange={e => setInfo({ ...info, product: e.target.value })}
                        placeholder="e.g., PAN-OS" 
                        className="w-full bg-[#0d1117] border border-[#243044] rounded p-2.5 text-sm text-[#e2e8f0] focus:border-[#3b82f6] outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[#94a3b8] text-[10px] uppercase font-bold tracking-widest">Environment</label>
                    <div className="flex gap-2">
                       {["production", "staging", "development"].map(env => (
                          <button
                            key={env}
                            onClick={() => setInfo({ ...info, env })}
                            className={cn(
                              "flex-1 py-2 text-xs font-mono font-medium rounded border transition-colors capitalize",
                              info.env === env 
                                ? "bg-[#3b82f6]/10 border-[#3b82f6] text-[#60a5fa]" 
                                : "bg-[#0d1117] border-[#243044] text-[#64748b] hover:text-[#e2e8f0]"
                            )}
                          >
                            {env}
                          </button>
                       ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                  <p className="text-[#94a3b8] text-sm mb-4">How will ULPF receive logs from this source?</p>
                  {TRANSPORTS.map(t => {
                    const Icon = t.icon;
                    return (
                      <div 
                        key={t.id}
                        onClick={() => setTransport(t.id)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                          transport === t.id 
                            ? "bg-[#1c2433] border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                            : "bg-[#0d1117] border-[#1e2d3d] hover:border-[#374151]"
                        )}
                      >
                        <div className={cn("p-2 rounded-full", transport === t.id ? "bg-[#3b82f6]/20 text-[#60a5fa]" : "bg-[#1e2d3d] text-[#64748b]")}>
                           <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 font-semibold text-sm text-[#e2e8f0]">{t.name}</div>
                        {transport === t.id && <CheckCircle2 className="w-5 h-5 text-[#3b82f6]" />}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                  <p className="text-[#94a3b8] text-sm mb-4">Select the expected log format, or let ULPF automatically detect and map it.</p>
                  {FORMATS.map(f => (
                    <div 
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                        format === f.id 
                          ? "bg-[#1c2433] border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                          : "bg-[#0d1117] border-[#1e2d3d] hover:border-[#374151]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", format === f.id ? "border-[#3b82f6]" : "border-[#374151]")}>
                          {format === f.id && <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />}
                        </div>
                        <span className="font-mono text-sm text-[#e2e8f0]">{f.name}</span>
                      </div>
                      {f.recommended && (
                         <span className="text-[9px] font-bold uppercase tracking-widest text-[#8b5cf6] bg-[#8b5cf6]/10 px-2 py-0.5 rounded">Recommended</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <div className="flex flex-col h-full space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <p className="text-[#94a3b8] text-sm">Provide a single raw sample event to generate the parser mapping.</p>
                  <textarea 
                    value={sampleLog}
                    onChange={e => setSampleLog(e.target.value)}
                    placeholder="Paste raw log event here..."
                    className="flex-1 w-full bg-[#0d1117] border border-[#243044] rounded-lg p-4 text-xs font-mono text-[#a5b4fc] focus:border-[#3b82f6] outline-none transition-colors resize-none shadow-inner"
                  />
                  <div className="bg-[#1e2d3d]/30 border border-[#1e2d3d] p-3 rounded text-xs text-[#94a3b8] flex items-start gap-2">
                    <BrainCircuit className="w-4 h-4 text-[#8b5cf6] flex-shrink-0 mt-0.5" />
                    <span>ULPF will use advanced heuristics to identify keys, values, and timestamp formats automatically.</span>
                  </div>
                </div>
              )}

              {/* STEP 5 */}
              {step === 5 && (
                <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in fade-in duration-500">
                  {isAnalyzing ? (
                    <>
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-[#1e2d3d] border-t-[#3b82f6] animate-spin" />
                        <SearchCode className="w-6 h-6 text-[#3b82f6] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-[#e2e8f0] font-semibold text-lg">Analyzing Payload</h3>
                        <p className="text-[#64748b] text-sm font-mono">Detecting format and extracting tokens...</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center">
                        <Check className="w-8 h-8 text-[#22c55e]" />
                      </div>
                      <div className="text-center space-y-2 w-full">
                        <h3 className="text-[#e2e8f0] font-semibold text-lg">Analysis Complete</h3>
                        
                        <div className="bg-[#0d1117] border border-[#1e2d3d] rounded-lg p-4 mt-4 space-y-3 text-left">
                           <div className="flex justify-between items-center border-b border-[#1e2d3d] pb-2">
                             <span className="text-[#64748b] text-[10px] uppercase font-mono">Detected Format</span>
                             <span className="text-[#3b82f6] font-mono text-sm">{sampleLog.includes("{") ? "JSON" : "Syslog / Delimited"}</span>
                           </div>
                           <div className="flex justify-between items-center border-b border-[#1e2d3d] pb-2">
                             <span className="text-[#64748b] text-[10px] uppercase font-mono">Extracted Fields</span>
                             <span className="text-[#e2e8f0] font-mono text-sm font-bold">{detectedFields.length}</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-[#64748b] text-[10px] uppercase font-mono">AI Confidence</span>
                             <span className="text-[#4ade80] font-mono text-sm font-bold bg-[#052e16] px-2 py-0.5 rounded border border-[#22c55e]/30">94.2%</span>
                           </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* STEP 6 */}
              {step === 6 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <p className="text-[#94a3b8] text-sm mb-2">Map the extracted source fields to the ULPF Universal Schema.</p>
                  
                  <div className="space-y-2">
                    {detectedFields.map(field => {
                       const mapped = mapping[field];
                       return (
                         <div key={field} className="flex flex-col gap-1 p-3 bg-[#0d1117] border border-[#1e2d3d] rounded-lg focus-within:border-[#3b82f6] transition-colors">
                            <div className="text-[#e2e8f0] text-xs font-mono font-bold">{field}</div>
                            <div className="flex items-center gap-2 mt-1">
                               <ArrowRight className="w-3 h-3 text-[#64748b] flex-shrink-0" />
                               <select 
                                 className={cn(
                                   "flex-1 bg-[#050709] border rounded p-1.5 text-xs font-mono outline-none appearance-none cursor-pointer",
                                   mapped ? "text-[#4ade80] border-[#22c55e]/30" : "text-[#64748b] border-[#243044]"
                                 )}
                                 value={mapped || ""}
                                 onChange={e => setMapping({ ...mapping, [field]: e.target.value })}
                               >
                                 <option value="">-- Ignored / Keep as Extra --</option>
                                 {UNIVERSAL_SCHEMA_FIELDS.map(sf => (
                                    <option key={sf} value={sf}>{sf}</option>
                                 ))}
                               </select>
                            </div>
                         </div>
                       )
                    })}
                  </div>
                </div>
              )}

              {/* STEP 7 */}
              {step === 7 && (
                <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in fade-in duration-500">
                  {isValidating ? (
                    <>
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-[#1e2d3d] border-t-[#8b5cf6] animate-spin" />
                        <Cpu className="w-6 h-6 text-[#8b5cf6] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-[#e2e8f0] font-semibold text-lg">Running Validation</h3>
                        <p className="text-[#64748b] text-sm font-mono">Simulating parser execution...</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center">
                        <ShieldCheck className="w-8 h-8 text-[#22c55e]" />
                      </div>
                      <div className="text-center space-y-2 w-full">
                        <h3 className="text-[#e2e8f0] font-semibold text-lg">Validation Successful</h3>
                        <div className="bg-[#0d1117] border border-[#1e2d3d] rounded-lg p-4 mt-4 space-y-3 text-left">
                           <div className="flex justify-between items-center border-b border-[#1e2d3d] pb-2">
                             <span className="text-[#64748b] text-[10px] uppercase font-mono">Parsed Successfully</span>
                             <span className="text-[#4ade80] font-mono text-sm font-bold flex items-center gap-1"><Check className="w-3 h-3"/> Yes</span>
                           </div>
                           <div className="flex justify-between items-center border-b border-[#1e2d3d] pb-2">
                             <span className="text-[#64748b] text-[10px] uppercase font-mono">Mapped Fields</span>
                             <span className="text-[#e2e8f0] font-mono text-sm font-bold">{Object.keys(mapping).length}</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-[#64748b] text-[10px] uppercase font-mono">Unmapped Fields</span>
                             <span className="text-[#eab308] font-mono text-sm font-bold">{detectedFields.length - Object.keys(mapping).length}</span>
                           </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* STEP 8 */}
              {step === 8 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <p className="text-[#94a3b8] text-sm">Review the source configuration before deploying to the active pipeline.</p>
                  
                  <div className="bg-[#0d1117] border border-[#1e2d3d] rounded-lg overflow-hidden">
                     <div className="px-4 py-2 bg-[#121822] border-b border-[#1e2d3d] text-[#64748b] text-[10px] font-mono uppercase font-bold tracking-widest">
                       Deployment Summary
                     </div>
                     <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center border-b border-[#1e2d3d]/50 pb-2">
                          <span className="text-[#64748b] text-xs font-mono">Name</span>
                          <span className="text-[#e2e8f0] text-sm font-mono font-medium">{info.name || "—"}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-[#1e2d3d]/50 pb-2">
                          <span className="text-[#64748b] text-xs font-mono">Transport</span>
                          <span className="text-[#3b82f6] text-sm font-mono uppercase font-medium">{transport}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-[#1e2d3d]/50 pb-2">
                          <span className="text-[#64748b] text-xs font-mono">Format</span>
                          <span className="text-[#e2e8f0] text-sm font-mono font-medium">{format}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-[#1e2d3d]/50 pb-2">
                          <span className="text-[#64748b] text-xs font-mono">Environment</span>
                          <span className="text-[#e2e8f0] text-sm font-mono font-medium capitalize">{info.env}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#64748b] text-xs font-mono">Action</span>
                          <span className="text-[#e2e8f0] text-xs font-mono font-bold bg-[#8b5cf6]/20 text-[#c4b5fd] px-2 py-0.5 rounded">Generate & Deploy Parser</span>
                        </div>
                     </div>
                  </div>
                </div>
              )}

           </div>

           {/* Footer Controls */}
           <div className="p-4 border-t border-[#1e2d3d] bg-[#0d1117] flex justify-between items-center">
              <Button 
                 variant="ghost" 
                 onClick={handlePrev} 
                 disabled={step === 1 || isAnalyzing || isValidating || isDeploying}
                 leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <div className="flex gap-1">
                 {STEPS.map((_, i) => (
                   <div key={i} className={cn("w-1.5 h-1.5 rounded-full", step > i ? "bg-[#3b82f6]" : "bg-[#1e2d3d]")} />
                 ))}
              </div>
              <Button 
                 variant="primary" 
                 onClick={handleNext}
                 disabled={isAnalyzing || isValidating || isDeploying || (step === 4 && !sampleLog.trim())}
                 rightIcon={step < 8 ? <ArrowRight className="w-4 h-4" /> : undefined}
                 leftIcon={step === 8 ? (isDeploying ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4" />) : undefined}
              >
                {step === 4 ? "Analyze Log" : step === 6 ? "Test Parser" : step === 8 ? (isDeploying ? "Deploying..." : "Deploy Pipeline") : "Continue"}
              </Button>
           </div>
        </div>

        {/* Right Pane: Persistent Preview */}
        <div className="flex-1 flex flex-col bg-[#050709] relative overflow-hidden">
           
           {/* Abstract Background pattern */}
           <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

           <div className="relative z-10 flex flex-col h-full p-8">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[#64748b] font-mono text-xs uppercase tracking-widest font-bold">Live Preview</h3>
                 <div className="flex gap-2">
                    <span className="flex items-center gap-1.5 text-[#374151] font-mono text-[10px] uppercase">
                       <div className={cn("w-2 h-2 rounded-full", step >= 4 ? "bg-[#22c55e]" : "bg-[#1e2d3d]")} /> Input
                    </span>
                    <span className="flex items-center gap-1.5 text-[#374151] font-mono text-[10px] uppercase">
                       <div className={cn("w-2 h-2 rounded-full", step >= 6 ? "bg-[#3b82f6]" : "bg-[#1e2d3d]")} /> Map
                    </span>
                    <span className="flex items-center gap-1.5 text-[#374151] font-mono text-[10px] uppercase">
                       <div className={cn("w-2 h-2 rounded-full", step >= 7 ? "bg-[#8b5cf6]" : "bg-[#1e2d3d]")} /> Output
                    </span>
                 </div>
              </div>

              {step < 4 ? (
                <div className="flex-1 border border-dashed border-[#1e2d3d] rounded-xl flex items-center justify-center flex-col gap-4 bg-[#0d1117]/50 backdrop-blur">
                  <FileText className="w-12 h-12 text-[#1e2d3d]" />
                  <p className="text-[#374151] text-sm font-mono text-center max-w-sm">Provide a sample log event in Step 4 to activate the live preview.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-6 min-h-0">
                  
                  {/* Raw Input Box */}
                  <div className={cn(
                    "flex-shrink-0 transition-all duration-500 border border-[#1e2d3d] rounded-lg overflow-hidden flex flex-col bg-[#0a0d12] shadow-xl",
                    step >= 6 ? "h-[200px]" : "flex-1"
                  )}>
                     <div className="px-4 py-2 bg-[#121822] border-b border-[#1e2d3d] flex items-center justify-between">
                       <span className="text-[#94a3b8] text-[9px] uppercase font-bold tracking-widest">1. Raw Event</span>
                       <span className="text-[#64748b] text-[9px] font-mono">{sampleLog.length} bytes</span>
                     </div>
                     <div className="flex-1 p-4 overflow-auto text-xs font-mono text-[#a5b4fc] whitespace-pre-wrap leading-relaxed">
                       {sampleLog || "No sample provided."}
                     </div>
                  </div>

                  {/* Mapping Output */}
                  {step >= 6 && (
                    <div className="flex-1 border border-[#1e2d3d] rounded-lg overflow-hidden flex flex-col bg-[#050709] shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-500">
                       <div className="px-4 py-2 bg-[#121822] border-b border-[#1e2d3d] flex items-center justify-between">
                         <span className="text-[#94a3b8] text-[9px] uppercase font-bold tracking-widest">2. Normalized JSON (Preview)</span>
                         <span className={cn("text-[9px] font-mono font-bold px-2 py-0.5 rounded", step >= 7 ? "bg-[#052e16] text-[#4ade80] border border-[#22c55e]/30" : "bg-[#1c2433] text-[#94a3b8] border border-[#243044]")}>
                           {step >= 7 ? "VALIDATED" : "DRAFT"}
                         </span>
                       </div>
                       <div className="flex-1 p-4 overflow-auto text-xs font-mono text-[#e2e8f0]">
                         <pre>
                           {JSON.stringify(
                             validationResult ? validationResult.parsed : { ...mapping, _preview: "Data will appear here post-validation" },
                             null, 
                             2
                           )}
                         </pre>
                       </div>
                    </div>
                  )}

                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
