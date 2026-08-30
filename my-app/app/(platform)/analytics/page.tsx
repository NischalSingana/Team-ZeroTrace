"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import {
  Activity, ShieldAlert, Zap, Clock, ChevronDown, Filter, LayoutGrid, Search, RefreshCw
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { 
  TOP_IPS, TOP_USERS, PARSER_PERF, CATEGORY_DISTRIBUTION 
} from "./data";
import { cn } from "@/lib/utils/cn";
import { MetricLabel } from "@/components/ui/tooltip";
import { PageErrorState } from "@/components/ui/error-fallback";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonBlock, SkeletonMetric } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  getThroughput,
  getSeverityBreakdown,
  getTopSources,
  getEventVolume,
} from "@/lib/services/analytics";
import type { ThroughputPoint, SeverityBreakdown, SourceTopEntry, EventVolumePoint } from "@/lib/types";

interface AnalyticsData {
  throughput: ThroughputPoint[];
  severity: SeverityBreakdown | null;
  topSources: SourceTopEntry[];
  volume: EventVolumePoint[];
  // static supplemental data
  topIps: typeof TOP_IPS;
  topUsers: typeof TOP_USERS;
  parserPerf: typeof PARSER_PERF;
  categories: typeof CATEGORY_DISTRIBUTION;
}


const StatBlock = ({ 
  title, 
  tooltip, 
  value, 
  icon: Icon, 
  trend 
}: { title: string; tooltip: string; value: string; icon: LucideIcon; trend: number }) => (
  <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded-lg p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#3b82f6]/50 transition-colors">
    <div className="flex justify-between items-start mb-4">
      <MetricLabel label={title} tooltip={tooltip} className="text-[#94a3b8] text-xs font-mono uppercase tracking-widest" />
      <div className="p-1.5 bg-[#1c2433] rounded border border-[#243044] text-[#a5b4fc]">
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div>
      <div className="text-3xl font-light text-[#e2e8f0] tracking-tight">{value}</div>
      <div className={cn("text-[10px] font-mono mt-1 font-bold", trend > 0 ? "text-[#4ade80]" : "text-[#ef4444]")}>
        {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% from yesterday
      </div>
    </div>
    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#3b82f6]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
);

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [throughput, severity, topSources, volume] = await Promise.all([
        getThroughput("24h"),
        getSeverityBreakdown(),
        getTopSources(),
        getEventVolume("24h"),
      ]);
      setData({ 
        throughput, 
        severity, 
        topSources, 
        volume,
        topIps: TOP_IPS,
        topUsers: TOP_USERS,
        parserPerf: PARSER_PERF,
        categories: CATEGORY_DISTRIBUTION,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load analytics"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (error && !loading && !data) {
    return (
      <PageErrorState 
        error={error} 
        onRetry={fetchData} 
      />
    );
  }


  return (
    <div className="flex flex-col h-full bg-[#050709] overflow-y-auto overflow-x-hidden">
      
      <PageHeader 
        title="Analytics Dashboard" 
        description="See event volume, parser performance, and top sources at a glance."
        actions={
          <div className="flex gap-3">
            <button className="bg-[#0a0d12] border border-[#1e2d3d] hover:bg-[#121822] text-[#e2e8f0] text-xs px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors">
              <Filter className="w-3.5 h-3.5 text-[#64748b]" /> Global Filter
            </button>
            <button className="bg-[#0a0d12] border border-[#1e2d3d] hover:bg-[#121822] text-[#e2e8f0] text-xs px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors">
              <Clock className="w-3.5 h-3.5 text-[#64748b]" /> Last 24 Hours <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        
        {/* Top Stats */}
        <div className="grid grid-cols-4 gap-4">
          {loading || !data ? (
            <>
              <SkeletonMetric />
              <SkeletonMetric />
              <SkeletonMetric />
              <SkeletonMetric />
            </>
          ) : (
            <>
              <StatBlock 
                title="Total Events" 
                tooltip="All events ingested across every connected source in the selected time window."
                value="14.2M" 
                trend={12.4} 
                icon={Activity} 
              />
              <StatBlock 
                title="Auth Failures" 
                tooltip="Failed authentication attempts, a common signal of brute-force or credential abuse."
                value="124.5K" 
                trend={4.2} 
                icon={ShieldAlert} 
              />
              <StatBlock 
                title="Avg Latency" 
                tooltip="Average time it takes to process one event from ingest to storage."
                value="2.1ms" 
                trend={-1.5} 
                icon={Zap} 
              />
              <StatBlock 
                title="Active Parsers" 
                tooltip="Parsers currently running to turn raw logs into the normalized schema."
                value="42" 
                trend={0} 
                icon={LayoutGrid} 
              />
            </>
          )}
        </div>

        {/* Main Volume Chart & Category Dist */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-[#0a0d12] border border-[#1e2d3d] rounded-lg p-5">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-[#e2e8f0] text-sm font-semibold tracking-tight">
                  <MetricLabel label="Ingestion Volume by Severity" tooltip="Number of events processed over time, split by severity level." />
                </h3>
                <div className="flex items-center gap-4 text-[10px] font-mono uppercase">
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#ef4444]" /> Critical</span>
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f97316]" /> High</span>
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#eab308]" /> Medium</span>
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#3b82f6]" /> Low</span>
                </div>
             </div>
             <div className="h-[280px] w-full">
                {loading || !data ? (
                  <Skeleton className="h-full w-full bg-[#1c2433]" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.volume} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCrit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" vertical={false} />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0a0d12', borderColor: '#1e2d3d', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                      />
                      <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="url(#colorCrit)" />
                      <Area type="monotone" dataKey="high" stackId="1" stroke="#f97316" fill="url(#colorHigh)" />
                      <Area type="monotone" dataKey="medium" stackId="1" stroke="#eab308" fill="url(#colorMed)" />
                      <Area type="monotone" dataKey="low" stackId="1" stroke="#3b82f6" fill="url(#colorLow)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
             </div>
          </div>

          <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded-lg p-5 flex flex-col">
            <h3 className="text-[#e2e8f0] text-sm font-semibold tracking-tight mb-6">
              <MetricLabel label="Event Category Distribution" tooltip="Breakdown of events by type, such as network or authentication activity." />
            </h3>
            <div className="flex-1 flex flex-col justify-center gap-6">
              {loading || !data ? (
                <Skeleton className="h-32 w-full bg-[#1c2433]" />
              ) : data.categories.length === 0 ? (
                <EmptyState
                  title="No categories"
                  description="There are no event categories to display right now."
                  icon={<Search className="w-8 h-8" />}
                />
              ) : (
                <>
                  <div className="h-4 w-full rounded-full flex overflow-hidden shadow-inner">
                    {data.categories.map((cat, i) => (
                      <div key={i} style={{ width: `${cat.value}%`, backgroundColor: cat.color }} className="h-full border-r border-[#0a0d12] last:border-0 hover:brightness-110 transition-all cursor-pointer" title={`${cat.name}: ${cat.value}%`} />
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="space-y-3">
                    {data.categories.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-[#94a3b8] text-xs font-mono">{cat.name}</span>
                        </div>
                        <span className="text-[#e2e8f0] text-xs font-bold font-mono">{cat.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Rankings & Performance */}
        <div className="grid grid-cols-3 gap-6 pb-12">
          
          <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded-lg p-5">
            <h3 className="text-[#e2e8f0] text-sm font-semibold tracking-tight mb-4">
              <MetricLabel label="Top Source IPs" tooltip="IP addresses sending the most events, ranked by volume." />
            </h3>
            {loading || !data ? (
              <SkeletonBlock rows={5} />
            ) : data.topIps.length === 0 ? (
              <EmptyState
                title="No source IPs"
                description="No source IP data is available for the selected time window."
                icon={<Search className="w-8 h-8" />}
              />
            ) : (
              <div className="space-y-3">
                {data.topIps.map((item, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="text-[#64748b] text-[10px] font-mono w-3">{i + 1}.</span>
                      <span className="text-[#a5b4fc] text-xs font-mono group-hover:text-[#c4b5fd] transition-colors cursor-pointer">{item.ip}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-1.5 bg-[#1c2433] rounded-full overflow-hidden hidden sm:block">
                        <div className={cn("h-full", item.risk === 'high' ? "bg-[#ef4444]" : item.risk === 'medium' ? "bg-[#f97316]" : "bg-[#3b82f6]")} style={{ width: `${(item.count / 15000) * 100}%` }} />
                      </div>
                      <span className="text-[#94a3b8] text-xs font-mono w-12 text-right">{item.count.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded-lg p-5">
            <h3 className="text-[#e2e8f0] text-sm font-semibold tracking-tight mb-4">
              <MetricLabel label="Top Users (Auth Failures)" tooltip="User accounts with the most failed login attempts." />
            </h3>
            {loading || !data ? (
              <SkeletonBlock rows={5} />
            ) : data.topUsers.length === 0 ? (
              <EmptyState
                title="No user data"
                description="No authentication failure data is available right now."
                icon={<Search className="w-8 h-8" />}
              />
            ) : (
              <div className="space-y-3">
                {data.topUsers.map((item, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="text-[#64748b] text-[10px] font-mono w-3">{i + 1}.</span>
                      <span className="text-[#e2e8f0] text-xs font-mono group-hover:text-white transition-colors cursor-pointer">{item.user}</span>
                      {item.type === 'privileged' && <span className="text-[8px] uppercase tracking-widest text-[#eab308] border border-[#eab308]/30 bg-[#eab308]/10 px-1 py-0.5 rounded ml-1">Priv</span>}
                    </div>
                    <span className="text-[#94a3b8] text-xs font-mono">{item.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#0a0d12] border border-[#1e2d3d] rounded-lg p-5">
            <h3 className="text-[#e2e8f0] text-sm font-semibold tracking-tight mb-4">
              <MetricLabel label="Parser Performance Pipeline" tooltip="Speed and volume of each parser that converts raw logs into normalized events." />
            </h3>
            {loading || !data ? (
              <SkeletonBlock rows={5} />
            ) : data.parserPerf.length === 0 ? (
              <EmptyState
                title="No parser data"
                description="No parsers are reporting performance metrics right now."
                icon={<Search className="w-8 h-8" />}
                action={
                  <Button variant="outline" size="sm" onClick={fetchData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                    Refresh
                  </Button>
                }
              />
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#1e2d3d]">
                    <th className="pb-2 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono">Parser</th>
                    <th className="pb-2 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono text-right">
                      <MetricLabel label="Vol" tooltip="Event volume processed by this parser." />
                    </th>
                    <th className="pb-2 text-[#64748b] text-[10px] uppercase font-bold tracking-widest font-mono text-right">
                      <MetricLabel label="Latency" tooltip="Average processing time per event." />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2d3d]/50">
                  {data.parserPerf.map((p, i) => (
                    <tr key={i} className="group">
                      <td className="py-2.5 text-xs text-[#a5b4fc] font-mono group-hover:text-[#c4b5fd] cursor-pointer truncate max-w-[120px]">{p.name}</td>
                      <td className="py-2.5 text-xs text-[#94a3b8] font-mono text-right">{p.events}</td>
                      <td className={cn("py-2.5 text-xs font-mono text-right font-bold", p.status === 'degraded' ? "text-[#ef4444]" : "text-[#4ade80]")}>{p.latency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
