"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton, SkeletonBlock } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { BackendErrorState } from "@/components/ui/error-fallback";
import { Timestamp } from "@/components/ui/timestamp";
import { MetricLabel } from "@/components/ui/tooltip";
import {
  ShieldAlert, Activity, Users, Globe, Clock, Search,
  BrainCircuit, ExternalLink, Network, AlertTriangle, RefreshCw, Inbox
} from "lucide-react";
import { fetchJson } from "@/lib/services/api";
import { useRouter } from "next/navigation";
import type { AnomalyAlert, AnomalyType } from "@/lib/types";

export default function DetectionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [detections, setDetections] = useState<AnomalyAlert[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson<AnomalyAlert[]>("/api/detections/queue");
      setDetections(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load detections"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getSignalIcon = (type: AnomalyType) => {
    switch (type) {
      case 'brute_force': return <AlertTriangle className="w-4 h-4 text-[#ef4444]" />;
      case 'privilege_escalation': return <ShieldAlert className="w-4 h-4 text-[#ef4444]" />;
      case 'spike': return <Activity className="w-4 h-4 text-[#f97316]" />;
      case 'drop': return <Activity className="w-4 h-4 text-[#64748b]" />;
      case 'format_drift': return <BrainCircuit className="w-4 h-4 text-[#a855f7]" />;
      case 'exfiltration': return <Globe className="w-4 h-4 text-[#f97316]" />;
      case 'lateral_movement': return <Network className="w-4 h-4 text-[#eab308]" />;
      default: return <Activity className="w-4 h-4 text-[#64748b]" />;
    }
  };

  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'critical': return "#ef4444";
      case 'high': return "#f97316";
      case 'medium': return "#eab308";
      default: return "#3b82f6";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050709] overflow-hidden">

      <PageHeader
        title="Detections & Anomalies"
        description="Deep-dive investigation view for high-confidence security signals."
        badge={
          <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-[#450a0a] text-[#fca5a5] border border-[#ef4444]/30 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> 1 Active Investigation
          </span>
        }
      />

      {error ? (
        <div className="flex-1 flex items-center justify-center">
          <BackendErrorState error={error} onRetry={load} />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">

          {/* Left Pane: Anomaly Queue */}
          <div className="w-[320px] border-r border-[#1e2d3d] bg-[#0a0d12] flex flex-col flex-shrink-0 z-10 shadow-xl">
            <div className="px-4 py-3 border-b border-[#1e2d3d] bg-[#080b0f] flex items-center justify-between">
              <h2 className="text-[#e2e8f0] text-sm font-semibold tracking-tight">Detection Queue</h2>
              <span className="text-[#64748b] text-[10px] font-mono uppercase font-bold tracking-widest">{detections.length} Total</span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  <Skeleton className="h-24 w-full bg-[#1e2d3d]" />
                  <Skeleton className="h-24 w-full bg-[#1e2d3d]" />
                  <Skeleton className="h-24 w-full bg-[#1e2d3d]" />
                </div>
              ) : detections.length === 0 ? (
                <EmptyState
                  title="Detection queue is empty"
                  description="No active or recent detections have been identified."
                  icon={<Inbox className="w-10 h-10" />}
                  action={
                    <Button variant="outline" size="sm" onClick={load} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                      Refresh
                    </Button>
                  }
                />
              ) : (
                detections.map((item, idx) => {
                  const riskColor = getRiskColor(item.severity);
                  const isSelected = selectedId ? item.id === selectedId : idx === 0;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`p-4 border-b border-[#1e2d3d] cursor-pointer transition-colors ${
                        isSelected ? "bg-[#1c2433]/50 border-l-2" : "border-[#1e2d3d]/50 hover:bg-[#0d1117] opacity-75"
                      }`}
                      style={{ borderLeftColor: isSelected ? riskColor : undefined }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border"
                          style={{
                            color: riskColor,
                            backgroundColor: `${riskColor}20`,
                            borderColor: `${riskColor}30`,
                          }}
                        >
                          {item.severity} Risk
                        </span>
                        <Timestamp iso={item.detected_at} className="text-[10px]" />
                      </div>
                      <h3 className="text-[#e2e8f0] text-sm font-semibold mb-1">{item.title}</h3>
                      <p className="text-[#94a3b8] text-xs line-clamp-2">{item.description}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Main Pane: Investigation View */}
          <div className="flex-1 overflow-y-auto bg-[#050709] relative">

            {loading ? (
              <div className="p-8 space-y-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-80 bg-[#1e2d3d]" />
                    <Skeleton className="h-4 w-96 bg-[#1e2d3d]" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-3 w-28 bg-[#1e2d3d]" />
                    <Skeleton className="h-10 w-20 bg-[#1e2d3d]" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-[#0a0d12] border border-[#1e2d3d] rounded p-4 space-y-2">
                      <Skeleton className="h-2 w-20 bg-[#1e2d3d]" />
                      <Skeleton className="h-6 w-16 bg-[#1e2d3d]" />
                    </div>
                  ))}
                </div>
                <SkeletonBlock rows={6} />
              </div>
            ) : (
              <>
                {/* Header Area */}
                {detections.length > 0 ? (
                (() => {
                  const selectedDetection = detections.find(d => d.id === selectedId) || detections[0];
                  return (
                  <>
                  <div className="p-8 border-b border-[#1e2d3d] bg-gradient-to-b from-[#ef4444]/5 to-transparent">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          {getSignalIcon(selectedDetection.alert_type)}
                          <h1 className="text-2xl font-bold text-[#e2e8f0] tracking-tight">{selectedDetection.title}</h1>
                        </div>
                        <p className="text-[#94a3b8] text-sm max-w-2xl">
                          {selectedDetection.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <MetricLabel
                          label="Confidence Score"
                          tooltip="Model confidence that the observed signals represent a true attack."
                          className="text-[10px] text-[#64748b] uppercase tracking-widest font-bold mb-1 font-mono"
                        />
                        <div className="text-4xl font-light text-[#ef4444] font-mono">{Math.round(selectedDetection.score * 100)}%</div>
                      </div>
                    </div>

                    {/* Signal Grid */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded p-4 flex items-center gap-4">
                        <div className="p-2 bg-[#ef4444]/10 rounded border border-[#ef4444]/20"><ShieldAlert className="w-5 h-5 text-[#ef4444]" /></div>
                        <div>
                          <div className="text-xl font-bold text-[#e2e8f0]">{selectedDetection.event_count}</div>
                        <MetricLabel
                          label="Total Events"
                          tooltip="Total events involved in this detection."
                          className="text-[#64748b] text-xs font-mono uppercase tracking-wider"
                        />
                      </div>
                    </div>
                    <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded p-4 flex items-center gap-4">
                      <div className="p-2 bg-[#f97316]/10 rounded border border-[#f97316]/20"><Globe className="w-5 h-5 text-[#f97316]" /></div>
                      <div>
                        <div className="text-xl font-bold text-[#e2e8f0]">1</div>
                        <MetricLabel
                          label="Source Count"
                          tooltip="Number of sources."
                          className="text-[#64748b] text-xs font-mono uppercase tracking-wider"
                        />
                      </div>
                    </div>
                    <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded p-4 flex items-center gap-4">
                      <div className="p-2 bg-[#3b82f6]/10 rounded border border-[#3b82f6]/20"><Users className="w-5 h-5 text-[#3b82f6]" /></div>
                      <div>
                        <div className="text-xl font-bold text-[#e2e8f0]">N/A</div>
                        <MetricLabel
                          label="Accounts Targeted"
                          tooltip="Distinct user accounts that the attack attempted to compromise."
                          className="text-[#64748b] text-xs font-mono uppercase tracking-wider"
                        />
                      </div>
                    </div>
                    <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded p-4 flex items-center gap-4">
                      <div className="p-2 bg-[#8b5cf6]/10 rounded border border-[#8b5cf6]/20"><Clock className="w-5 h-5 text-[#8b5cf6]" /></div>
                      <div>
                        <div className="text-xl font-bold text-[#e2e8f0] capitalize">{selectedDetection.status.replace(/_/g, " ")}</div>
                        <MetricLabel
                          label="Status"
                          tooltip="Current status of the anomaly."
                          className="text-[#64748b] text-xs font-mono uppercase tracking-wider"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline & Actions */}
                <div className="p-8 max-w-5xl mx-auto flex gap-12">

                  <div className="flex-1">
                    <h2 className="text-[#e2e8f0] text-sm font-semibold tracking-tight mb-6 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#3b82f6]" /> Signal Timeline
                    </h2>
                      <EmptyState
                        title="No signals yet"
                        description="Timeline integration requires timeline API endpoints which are under construction."
                        icon={<Search className="w-10 h-10" />}
                      />
                  </div>
                  <div className="w-[300px] flex-shrink-0 space-y-6">
                    <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded-lg p-5">
                      <h3 className="text-[#e2e8f0] text-sm font-semibold tracking-tight mb-4">Actions</h3>
                      <Button
                        className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white border-none mb-3"
                        onClick={() => router.push("/explorer")}
                        leftIcon={<Search className="w-4 h-4" />}
                      >
                        View Related Events
                      </Button>
                      <Button variant="outline" className="w-full" leftIcon={<Network className="w-4 h-4" />}>
                        Isolate Source IPs
                      </Button>
                    </div>

                    <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded-lg p-5">
                      <h3 className="text-[#e2e8f0] text-sm font-semibold tracking-tight mb-3 flex items-center gap-2">
                        <MetricLabel
                          label="MITRE ATT&CK"
                          tooltip="A globally accessible knowledge base of adversary tactics and techniques."
                          className="text-[#e2e8f0] text-sm font-semibold tracking-tight"
                        />
                      </h3>
                      <a href="#" className="flex items-center justify-between group">
                        <div className="text-xs text-[#a5b4fc] font-mono group-hover:text-[#c4b5fd]">T1110.003: Password Spraying</div>
                        <ExternalLink className="w-3.5 h-3.5 text-[#64748b] group-hover:text-[#a5b4fc]" />
                      </a>
                    </div>
                  </div>

                </div>
                </>
                  );
                })()
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <EmptyState
                      title="No Detection Details"
                      description="Select a detection from the queue to view its details."
                      icon={<Inbox className="w-10 h-10" />}
                    />
                  </div>
                )}

              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
