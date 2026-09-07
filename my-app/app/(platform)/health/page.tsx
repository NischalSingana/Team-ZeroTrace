"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  HardDrive, AlertCircle, Activity,
  ArrowRight, CheckCircle2, AlertTriangle, RotateCw
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import {
  COMPONENTS, PIPELINE_CHART_DATA, QUEUE_DATA, ServiceStatus
} from "./data";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { SkeletonBlock } from "@/components/ui/skeleton";
import { Timestamp } from "@/components/ui/timestamp";
import { getSystemHealth } from "@/lib/services/health";
import type { SystemHealth } from "@/lib/types";


const getStatusConfig = (status: ServiceStatus) => {
  switch(status) {
    case "Healthy": return { icon: CheckCircle2, color: "text-[#4ade80]", bg: "bg-[#4ade80]/10", border: "border-[#4ade80]/30" };
    case "Warning": return { icon: AlertTriangle, color: "text-[#eab308]", bg: "bg-[#eab308]/10", border: "border-[#eab308]/30" };
    case "Degraded": return { icon: AlertTriangle, color: "text-[#f97316]", bg: "bg-[#f97316]/10", border: "border-[#f97316]/30" };
    case "Offline": return { icon: AlertCircle, color: "text-[#ef4444]", bg: "bg-[#ef4444]/10", border: "border-[#ef4444]/30" };
  }
};

const FlowNode = ({ title, status, metric, subMetric }: { title: string; status: ServiceStatus; metric: string; subMetric: string }) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  
  return (
    <div className={cn(
      "bg-[#0a0d12] border rounded-lg p-4 w-[180px] flex flex-col items-center text-center relative z-10 transition-colors shadow-xl",
      status === "Healthy" ? "border-[#1e2d3d] hover:border-[#3b82f6]/50" : config.border
    )}>
      <div className={cn("p-2 rounded-full mb-3", config.bg, config.color)}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-[#e2e8f0] text-sm font-semibold mb-1">{title}</h3>
      <div className={cn("text-[9px] uppercase font-bold tracking-widest font-mono px-2 py-0.5 rounded border mb-3", config.color, config.bg, config.border)}>
        {status}
      </div>
      <div className="w-full pt-3 border-t border-[#1e2d3d]">
        <div className="text-[#e2e8f0] text-sm font-mono font-bold">{metric}</div>
        <div className="text-[#64748b] text-[9px] uppercase tracking-widest font-mono">{subMetric}</div>
      </div>
    </div>
  );
};

const SERVICE_STATUS_MAP: Record<SystemHealth["services"][number]["status"], ServiceStatus> = {
  up: "Healthy",
  degraded: "Degraded",
  down: "Offline",
};

interface HealthRow {
  key: string;
  name: string;
  category?: string;
  status: ServiceStatus;
  cpu?: number;
  memory?: string;
  throughput?: string;
  latency?: string;
  errors?: number;
  heartbeat: ReactNode;
}

function buildRows(health: SystemHealth | null): HealthRow[] {
  if (health) {
    return health.services.map((s) => ({
      key: s.name,
      name: s.name,
      status: SERVICE_STATUS_MAP[s.status] ?? "Healthy",
      latency: `${s.latency_ms}ms`,
      heartbeat: <Timestamp iso={s.last_checked} className="text-[10px]" />,
    }));
  }
  return COMPONENTS.map((c) => ({
    key: c.id,
    name: c.name,
    category: c.category,
    status: c.status,
    cpu: c.cpu,
    memory: c.memory,
    throughput: c.throughput,
    latency: c.latency,
    errors: c.errors,
    heartbeat: <span className="text-[#64748b] text-[10px] font-mono">{c.lastHeartbeat}</span>,
  }));
}

const METRIC_STATUS_COLORS: Record<SystemHealth["metrics"][number]["status"], string> = {
  healthy: "#4ade80",
  warning: "#eab308",
  critical: "#ef4444",
};

export default function HealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const h = await getSystemHealth();
      setHealth(h);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load system health"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const rows = buildRows(health);

  return (
    <div className="flex flex-col h-full bg-[#050709] overflow-y-auto overflow-x-hidden">
      
      <PageHeader 
        title="System Health" 
        description="Operational monitoring of ingestion pipelines, compute clusters, and storage infrastructure."
        actions={
          <div className="flex items-center gap-3">
            <span className="text-[#94a3b8] text-[10px] font-mono mr-2" suppressHydrationWarning>
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Updating…"}
            </span>
            <Button variant="outline" size="sm" leftIcon={<RotateCw className="w-3.5 h-3.5" />} onClick={fetchData}>
              Refresh
            </Button>
          </div>
        }
      />

      {health && (
        <div className="px-6 py-2 border-b border-[#1e2d3d] bg-[#050709] flex items-center gap-4 flex-shrink-0">
          <span className={cn(
            "text-[10px] font-mono font-bold uppercase tracking-widest",
            health.overall_status === "healthy" ? "text-[#4ade80]" :
            health.overall_status === "degraded" ? "text-[#eab308]" : "text-[#ef4444]"
          )}>
            Overall: {health.overall_status}
          </span>
          <span className="text-[#64748b] text-[10px] font-mono">
            Backend reporting · <Timestamp iso={health.last_updated} className="text-[10px]" />
          </span>
        </div>
      )}

      {error && !health && (
        <div className="px-6 py-2 border-b border-[#ef4444]/20 bg-[#450a0a]/20 text-[#fca5a5] text-[10px] font-mono flex-shrink-0">
          Backend unreachable ({error.message}) — showing cached reference data.
        </div>
      )}

      {loading && !health ? (
        <div className="flex-1 p-6">
          <SkeletonBlock rows={14} />
        </div>
      ) : (


      <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">

        {/* Live System Metrics */}
        {health && health.metrics.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {health.metrics.map((m) => {
              const color = METRIC_STATUS_COLORS[m.status] ?? "#64748b";
              const max = Math.max(...m.history, m.value, 1);
              return (
                <div key={m.name} className="bg-[#0a0d12] border border-[#1e2d3d] rounded-lg p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#64748b] text-[10px] uppercase tracking-widest font-mono">{m.label}</span>
                    <span
                      className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border"
                      style={{ color, backgroundColor: `${color}15`, borderColor: `${color}33` }}
                    >
                      {m.status}
                    </span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-[#e2e8f0] mb-3">
                    {m.value}
                    <span className="text-sm text-[#64748b] font-normal ml-1">{m.unit}</span>
                  </div>
                  <div className="flex items-end gap-0.5 h-8">
                    {m.history.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{ height: `${Math.max((h / max) * 100, 4)}%`, backgroundColor: `${color}55` }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Visual Dependency Flow */}
        <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded-lg p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3b82f6] via-[#f97316] to-[#4ade80]" />
          <h3 className="text-[#e2e8f0] text-sm font-semibold tracking-tight mb-8">Pipeline Architecture Flow</h3>
          
          <div className="flex items-center justify-between max-w-5xl mx-auto relative px-8 py-4">
            {/* Connecting Lines */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#1e2d3d] -z-0" />
            <div className="absolute top-1/2 left-1/4 w-[15%] h-0.5 bg-[#3b82f6] shadow-[0_0_8px_#3b82f6] animate-pulse -z-0" />
            <div className="absolute top-1/2 left-1/2 w-[15%] h-0.5 bg-[#f97316] shadow-[0_0_8px_#f97316] animate-pulse -z-0" />
            <div className="absolute top-1/2 right-1/4 w-[15%] h-0.5 bg-[#4ade80] shadow-[0_0_8px_#4ade80] animate-pulse -z-0" />

            <FlowNode title="Kafka Cluster" status="Healthy" metric="14.2k evt/s" subMetric="Ingestion" />
            <ArrowRight className="w-6 h-6 text-[#64748b] bg-[#050709] z-10" />
            
            <div className="flex flex-col gap-4 z-10">
              <FlowNode title="Parser Workers" status="Healthy" metric="14.1k evt/s" subMetric="Throughput" />
              <FlowNode title="AI Service" status="Degraded" metric="4500ms" subMetric="Latency" />
            </div>
            
            <ArrowRight className="w-6 h-6 text-[#64748b] bg-[#050709] z-10" />
            <FlowNode title="OpenSearch" status="Healthy" metric="8ms" subMetric="Write Latency" />
          </div>
        </div>

        {/* Telemetry Charts */}
        <div className="grid grid-cols-3 gap-6">
          
          <div className="col-span-2 bg-[#0a0d12] border border-[#1e2d3d] rounded-lg p-5">
            <h3 className="text-[#e2e8f0] text-sm font-semibold tracking-tight mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#3b82f6]" /> Pipeline Throughput (Events/sec)
            </h3>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PIPELINE_CHART_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0a0d12', borderColor: '#1e2d3d', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="ingress" stroke="#3b82f6" fill="url(#colorIn)" />
                  <Area type="monotone" dataKey="egress" stroke="#4ade80" fill="url(#colorOut)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded-lg p-5 flex flex-col">
            <h3 className="text-[#e2e8f0] text-sm font-semibold tracking-tight mb-4 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#eab308]" /> Kafka Queue Depth
            </h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={QUEUE_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                  <RechartsTooltip 
                    cursor={{ fill: '#1e2d3d', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#0a0d12', borderColor: '#1e2d3d', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="depth" fill="#eab308" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Component Grid Table */}
        <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded-lg overflow-hidden pb-12">
          <div className="px-6 py-4 border-b border-[#1e2d3d] bg-[#080b0f] flex items-center justify-between">
            <h3 className="text-[#e2e8f0] text-sm font-semibold tracking-tight">Microservices Health</h3>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#4ade80]"><CheckCircle2 className="w-3 h-3" /> Nominal</span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#f97316]"><AlertTriangle className="w-3 h-3" /> Degraded</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0a0d12] border-b border-[#1e2d3d]">
                  <th className="px-6 py-3 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono">Service</th>
                  <th className="px-6 py-3 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono text-center">Status</th>
                  <th className="px-6 py-3 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono text-center">CPU</th>
                  <th className="px-6 py-3 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono text-center">Memory</th>
                  <th className="px-6 py-3 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono text-right">Throughput</th>
                  <th className="px-6 py-3 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono text-right">Latency</th>
                  <th className="px-6 py-3 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono text-right">Errors</th>
                  <th className="px-6 py-3 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono text-right">Heartbeat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d3d]/50">
                {rows.map((comp) => {
                  const config = getStatusConfig(comp.status);
                  const latencyMs = comp.latency && comp.latency.includes("ms") ? parseInt(comp.latency) : 0;

                  return (
                    <tr key={comp.key} className="hover:bg-[#0d1117] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[#e2e8f0] text-xs font-semibold">{comp.name}</span>
                          {comp.category && (
                            <span className="text-[#64748b] text-[10px] font-mono mt-0.5">{comp.category}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn("inline-flex items-center justify-center text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase", config.color, config.bg, config.border)}>
                          {comp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {typeof comp.cpu === "number" ? (
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-12 h-1.5 bg-[#1c2433] rounded-full overflow-hidden">
                              <div className={cn("h-full", comp.cpu > 85 ? "bg-[#ef4444]" : comp.cpu > 70 ? "bg-[#eab308]" : "bg-[#3b82f6]")} style={{ width: `${comp.cpu}%` }} />
                            </div>
                            <span className="text-[#94a3b8] text-xs font-mono w-8">{comp.cpu}%</span>
                          </div>
                        ) : (
                          <span className="block text-center text-[#64748b] text-xs font-mono">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[#94a3b8] text-xs font-mono">{comp.memory ?? "—"}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[#e2e8f0] text-xs font-mono">{comp.throughput ?? "—"}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn("text-xs font-mono font-bold", latencyMs > 100 ? "text-[#f97316]" : "text-[#4ade80]")}>
                          {comp.latency ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn("text-xs font-mono font-bold", (comp.errors ?? 0) > 0 ? "text-[#ef4444]" : "text-[#64748b]")}>
                          {comp.errors ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {comp.heartbeat}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      )}
    </div>
  );
}
