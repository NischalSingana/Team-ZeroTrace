"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { 
  BrainCircuit, ShieldCheck, Play, CheckCircle2, XCircle, 
  Settings2, Activity, ArrowRight, Sparkles, Server, FileJson, 
  TerminalSquare, AlertTriangle, Search, RotateCw
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useRouter } from "next/navigation";
import { analyzeLog, generateParser, type AIMappingSuggestion } from "@/lib/services/ai";
import { MetricLabel } from "@/components/ui/tooltip";
import { BackendErrorState } from "@/components/ui/error-fallback";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonBlock } from "@/components/ui/skeleton";
import { isOfflineError } from "@/lib/services/api";

type SuggestionStatus = "pending" | "approved" | "rejected";

type Suggestion = AIMappingSuggestion & { status: SuggestionStatus };

export default function AIMappingPage() {
  const router = useRouter();
  const [rawLog, setRawLog] = useState('{"time": "2023-11-01T14:32:00Z", "client": "10.1.2.3", "target": "192.168.1.100", "usr": "admin_service", "result": "success", "action": "login"}');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisError, setAnalysisError] = useState<Error | null>(null);
  const [detectedFormat, setDetectedFormat] = useState("");
  const [formatConfidence, setFormatConfidence] = useState(0);
  
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [generatedParserId, setGeneratedParserId] = useState("");

  const resetAnalysis = () => {
    setAnalysisComplete(false);
    setSuggestions([]);
    setDetectedFormat("");
    setFormatConfidence(0);
    setAnalysisError(null);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await analyzeLog(rawLog);
      setDetectedFormat(result.detected_format);
      setFormatConfidence(result.format_confidence);
      setSuggestions(
        result.suggestions.map((s) => ({ ...s, status: "pending" as SuggestionStatus }))
      );
      setAnalysisComplete(true);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStatusChange = (idx: number, status: SuggestionStatus) => {
    setSuggestions((prev) => prev.map((s, i) => (i === idx ? { ...s, status } : s)));
  };

  const approvedCount = suggestions.filter((s) => s.status === "approved").length;
  const allReviewed = suggestions.every((s) => s.status !== "pending");

  const handleGenerate = async () => {
    setIsGenerating(true);
    setAnalysisError(null);
    try {
      const result = await generateParser(
        rawLog,
        suggestions,
        `AI Parser — ${detectedFormat}`,
        detectedFormat
      );
      setGeneratedParserId(result.parser_id);
      setIsGenerating(false);
      setIsGenerated(true);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err : new Error(String(err)));
      setIsGenerating(false);
    }
  };

  if (isGenerated) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#050709] gap-6 overflow-hidden relative">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#8b5cf6]/5 rounded-full blur-[100px] pointer-events-none" />

         <div className="w-20 h-20 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-full flex items-center justify-center animate-in zoom-in duration-500 z-10">
           <BrainCircuit className="w-10 h-10 text-[#a855f7]" />
         </div>
         <div className="text-center z-10">
            <h1 className="text-2xl font-semibold text-[#e2e8f0] mb-2">Parser Generated Successfully</h1>
            <p className="text-[#94a3b8] font-mono text-sm max-w-md mx-auto">
               AI has synthesized your approved mappings into a deterministic parser.
            </p>
         </div>
         
         <div className="bg-[#0d1117] border border-[#1e2d3d] rounded-lg p-6 w-[450px] space-y-4 shadow-2xl z-10">
            <div className="flex justify-between items-center border-b border-[#1e2d3d] pb-2">
              <span className="text-[#64748b] text-xs font-mono uppercase">Parser ID</span>
              <span className="text-[#3b82f6] text-sm font-mono font-bold">{generatedParserId}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[#1e2d3d] pb-2">
              <span className="text-[#64748b] text-xs font-mono uppercase">Approved Rules</span>
              <span className="text-[#e2e8f0] text-sm font-mono font-bold">{approvedCount}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[#1e2d3d] pb-2">
              <span className="text-[#64748b] text-xs font-mono uppercase">Validation</span>
              <span className="text-[#22c55e] text-xs font-mono flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Passed
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#64748b] text-xs font-mono uppercase">Status</span>
              <span className="text-[#a855f7] text-xs font-mono bg-[#3b0764] px-2 py-1 rounded border border-[#8b5cf6]/30 flex items-center gap-1 font-bold">
                 Ready for Activation
              </span>
            </div>
         </div>

         <div className="flex gap-4 mt-4 z-10">
            <Button variant="outline" onClick={() => router.push("/parsers/studio")}>Open in Parser Studio</Button>
            <Button variant="primary" onClick={() => router.push("/sources/new")} className="bg-[#8b5cf6] hover:bg-[#7c3aed] border-[#8b5cf6] text-white">Attach to Source</Button>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#050709] overflow-hidden">
      
      <PageHeader 
        title="AI Mapping Assistant" 
        description="Paste a raw log and the assistant suggests how its fields map to the common schema."
        badge={
          <div className="flex items-center gap-2 bg-[#0a0d12] border border-[#1e2d3d] px-2.5 py-1 rounded-md">
            <Server className="w-3.5 h-3.5 text-[#8b5cf6]" />
            <span className="text-[10px] font-mono text-[#94a3b8]">Model: <span className="text-[#c4b5fd] font-bold">OpenRouter</span></span>
            <div className="w-px h-3 bg-[#1e2d3d] mx-1" />
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
               <span className="text-[10px] font-mono text-[#22c55e] uppercase tracking-widest font-bold">Online & Ready</span>
            </div>
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden">
         
         <div className="w-[350px] border-r border-[#1e2d3d] bg-[#0a0d12] flex flex-col flex-shrink-0 relative z-10 shadow-2xl">
            <div className="px-4 py-3 border-b border-[#1e2d3d] bg-[#080b0f] flex items-center gap-2">
              <TerminalSquare className="w-4 h-4 text-[#64748b]" />
              <h2 className="text-[#e2e8f0] text-sm font-semibold tracking-tight">Unknown Payload</h2>
            </div>
            
            <div className="flex-1 p-4 flex flex-col">
              <p className="text-[#94a3b8] text-xs mb-3 font-mono">Input raw, unstructured log event for semantic analysis.</p>
              <textarea
                value={rawLog}
                onChange={e => setRawLog(e.target.value)}
                disabled={isAnalyzing || analysisComplete}
                className="flex-1 bg-[#050709] border border-[#243044] rounded-lg p-3 font-mono text-xs text-[#a5b4fc] focus:border-[#8b5cf6] outline-none resize-none disabled:opacity-50 transition-all leading-relaxed shadow-inner"
              />
            </div>
            
            {analysisError && (
              <div className="px-4 py-3 bg-[#450a0a]/30 border-t border-[#ef4444]/20">
                <BackendErrorState
                  title={isOfflineError(analysisError) ? "Backend offline" : "Analysis failed"}
                  error={analysisError}
                  onRetry={handleAnalyze}
                  className="py-4"
                />
              </div>
            )}
            
            <div className="p-4 border-t border-[#1e2d3d] bg-[#050709]">
              {!analysisComplete ? (
                <Button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing || rawLog.length === 0}
                  className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] border-[#8b5cf6] text-white"
                  leftIcon={isAnalyzing ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4"/>}
                >
                  {isAnalyzing ? "Analyzing Semantics..." : "Start Analysis"}
                </Button>
              ) : (
                <Button 
                  onClick={resetAnalysis}
                  variant="outline"
                  className="w-full"
                  leftIcon={<RotateCw className="w-4 h-4" />}
                >
                  Reset Analysis
                </Button>
              )}
            </div>
         </div>

         <div className="flex-1 border-r border-[#1e2d3d] bg-[#0d1117] flex flex-col">
            <div className="px-4 py-3 border-b border-[#1e2d3d] bg-[#080b0f] flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-[#8b5cf6]" />
              <h2 className="text-[#e2e8f0] text-sm font-semibold tracking-tight">Semantic Findings</h2>
            </div>

            <div className="flex-1 p-8">
               {!analysisComplete && !isAnalyzing && (
                 <EmptyState
                   title="Ready to analyze"
                   description="Paste a log on the left and start analysis to see field mappings."
                   icon={<Activity className="w-8 h-8" />}
                 />
               )}

               {isAnalyzing && (
                 <div className="h-full flex flex-col justify-center gap-6">
                   <Skeleton className="h-16 w-full bg-[#1c2433]" />
                   <Skeleton className="h-16 w-full bg-[#1c2433]" />
                   <Skeleton className="h-16 w-full bg-[#1c2433]" />
                 </div>
               )}

               {analysisComplete && (
                 <div className="space-y-6">
                   <div className="flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                     <div className="w-8 h-8 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                       <FileJson className="w-4 h-4 text-[#a855f7]" />
                     </div>
                     <div>
                       <h3 className="text-[#e2e8f0] text-sm font-semibold mb-1">Format Detection</h3>
                       <p className="text-[#94a3b8] text-xs font-mono leading-relaxed">
                         Detected format: <span className="text-[#4ade80]">{detectedFormat}</span>.{" "}
                         <MetricLabel 
                           label={`Confidence: ${formatConfidence.toFixed(1)}%`} 
                           tooltip="How certain the model is that it identified the correct log format." 
                           className="text-[#94a3b8] text-xs font-mono"
                         />
                       </p>
                     </div>
                   </div>

                   <div className="flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                     <div className="w-8 h-8 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                       <ShieldCheck className="w-4 h-4 text-[#a855f7]" />
                     </div>
                     <div>
                       <h3 className="text-[#e2e8f0] text-sm font-semibold mb-1">Entity Extraction</h3>
                       <p className="text-[#94a3b8] text-xs font-mono leading-relaxed">
                         Identified {suggestions.length} potential field mappings to the universal schema.
                       </p>
                     </div>
                   </div>

                   <div className="flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                     <div className="w-8 h-8 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                       <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                     </div>
                     <div>
                       <h3 className="text-[#e2e8f0] text-sm font-semibold mb-1">Schema Alignment</h3>
                       <p className="text-[#94a3b8] text-xs font-mono leading-relaxed">
                         Generated {suggestions.length} high-confidence mapping suggestions against the common schema. Ready for human review.
                       </p>
                     </div>
                   </div>
                 </div>
               )}
            </div>
         </div>

         <div className="w-[450px] bg-[#0a0d12] flex flex-col flex-shrink-0">
            <div className="px-4 py-3 border-b border-[#1e2d3d] bg-[#080b0f] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-[#64748b]" />
                <h2 className="text-[#e2e8f0] text-sm font-semibold tracking-tight">Review & Approve</h2>
              </div>
              {analysisComplete && (
                <span className="text-[#64748b] text-[10px] font-mono font-bold uppercase">
                  {approvedCount} / {suggestions.length} Approved
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!analysisComplete ? (
                <EmptyState
                  title="No suggestions yet"
                  description="Run the analysis to generate mapping suggestions for this log."
                  icon={<Search className="w-8 h-8" />}
                />
              ) : isAnalyzing ? (
                <SkeletonBlock rows={4} />
              ) : suggestions.length === 0 ? (
                <EmptyState
                  title="No mapping suggestions"
                  description="The assistant did not find any clear field matches for this log. Try a different sample or edit the payload."
                  icon={<AlertTriangle className="w-8 h-8" />}
                  action={
                    <Button variant="outline" size="sm" onClick={resetAnalysis} leftIcon={<RotateCw className="w-3.5 h-3.5" />}>
                      Try Another Log
                    </Button>
                  }
                />
              ) : (
                suggestions.map((s, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "rounded-lg border p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4",
                      s.status === "approved" ? "bg-[#052e16]/20 border-[#22c55e]/30" :
                      s.status === "rejected" ? "bg-[#7f1d1d]/10 border-[#ef4444]/20 opacity-50" :
                      "bg-[#0d1117] border-[#1e2d3d]"
                    )}
                    style={{ animationDelay: `${idx * 150}ms` }}
                  >
                     <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-[#050709] border border-[#243044] px-2 py-1 rounded text-[#e2e8f0] text-xs font-mono font-bold" title="Field name in the raw log">
                            {s.source_field}
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-[#64748b]" />
                          <div className={cn("px-2 py-1 rounded text-xs font-mono font-bold", 
                             s.status === "approved" ? "bg-[#22c55e]/20 text-[#4ade80]" : "bg-[#8b5cf6]/20 text-[#c4b5fd]"
                          )} title="Matching field in the common schema">
                             {s.target_field}
                          </div>
                        </div>
                        <MetricLabel 
                          label={`${(s.confidence * 100).toFixed(0)}%`} 
                          tooltip="How likely this mapping is correct, based on field names and sample values."
                          className="text-[10px] font-mono font-bold flex items-center gap-1 border rounded px-1.5 py-0.5 border-[#22c55e]/30 text-[#4ade80] bg-[#052e16]"
                        />
                     </div>
                     
                     <div className="text-[#94a3b8] text-[10px] font-mono mb-4 border-l-2 border-[#1e2d3d] pl-2">
                        {s.evidence}
                     </div>

                     <div className="flex items-center gap-2">
                        {s.status === "pending" ? (
                           <>
                             <Button size="xs" variant="primary" className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] border-none text-[#052e16]" onClick={() => handleStatusChange(idx, "approved")} leftIcon={<CheckCircle2 className="w-3.5 h-3.5"/>}>Approve</Button>
                             <Button size="xs" variant="outline" className="flex-1" onClick={() => handleStatusChange(idx, "rejected")} leftIcon={<XCircle className="w-3.5 h-3.5"/>}>Reject</Button>
                           </>
                        ) : s.status === "approved" ? (
                           <div className="flex-1 flex items-center justify-center gap-1.5 py-1 text-[#22c55e] text-[10px] font-bold uppercase tracking-widest cursor-pointer" onClick={() => handleStatusChange(idx, "pending")}>
                              <CheckCircle2 className="w-4 h-4" /> Approved (Undo)
                           </div>
                        ) : (
                           <div className="flex-1 flex items-center justify-center gap-1.5 py-1 text-[#ef4444] text-[10px] font-bold uppercase tracking-widest cursor-pointer" onClick={() => handleStatusChange(idx, "pending")}>
                              <XCircle className="w-4 h-4" /> Rejected (Undo)
                           </div>
                        )}
                     </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-[#1e2d3d] bg-[#050709] z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
              <Button 
                className={cn("w-full transition-all", allReviewed && approvedCount > 0 ? "bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border-transparent" : "")}
                variant={allReviewed && approvedCount > 0 ? "primary" : "outline"}
                disabled={!allReviewed || approvedCount === 0 || isGenerating}
                onClick={handleGenerate}
                leftIcon={isGenerating ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4"/>}
              >
                {isGenerating ? "Synthesizing Parser..." : "Generate Parser"}
              </Button>
              {analysisComplete && !allReviewed && suggestions.length > 0 && (
                <p className="text-center text-[#64748b] text-[9px] font-mono uppercase tracking-widest mt-2">
                  Review all suggestions to continue
                </p>
              )}
            </div>
         </div>

      </div>
    </div>
  );
}
