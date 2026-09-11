"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/lib/store/ui";
import { motion } from "framer-motion";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  Activity,
  Search,
  Database,
  Cpu,
  Brain,
  BarChart2,
  ShieldAlert,
  Code2,
  GitBranch,
  HeartPulse,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
  Plus,
  MonitorPlay,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Monitor",
    items: [
      { label: "Overview", href: "/overview", icon: LayoutDashboard },
      { label: "Live Pipeline", href: "/pipeline", icon: Activity },
      { label: "Detections", href: "/detections", icon: ShieldAlert, badge: "5", badgeColor: "#ef4444" },
    ],
  },
  {
    label: "Explore",
    items: [
      { label: "Log Explorer", href: "/explorer", icon: Search },
      { label: "Schema Explorer", href: "/schema", icon: Layers },
      { label: "Analytics", href: "/analytics", icon: BarChart2 },
    ],
  },
  {
    label: "Ingest",
    items: [
      { label: "Sources", href: "/sources", icon: Database },
      { label: "Add Source", href: "/sources/new", icon: Plus },
    ],
  },
  {
    label: "Processing",
    items: [
      { label: "Parser Registry", href: "/parsers", icon: GitBranch },
      { label: "Parser Studio", href: "/parsers/studio", icon: Code2 },
      { label: "AI Mapping", href: "/ai-mapping", icon: Brain },
    ],
  },
  {
    label: "System",
    items: [
      { label: "System Health", href: "/health", icon: HeartPulse },
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "Demo Mode", href: "/demo", icon: MonitorPlay },
    ],
  },
];

// Flatten nav for active-state calculation
const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

function getActiveHref(pathname: string): string | null {
  // Exact match wins
  const exact = ALL_NAV_ITEMS.find((item) => item.href === pathname);
  if (exact) return exact.href;

  // Longest prefix match for nested routes (e.g. /sources/[id] -> /sources)
  const matching = ALL_NAV_ITEMS.filter((item) => pathname.startsWith(item.href + "/"));
  if (matching.length === 0) return null;
  return matching.reduce((longest, item) =>
    item.href.length > longest.href.length ? item : longest
  ).href;
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const activeHref = getActiveHref(pathname);

  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r border-[#1e2d3d] bg-[#080b0f] transition-all duration-200 ease-in-out flex-shrink-0",
        sidebarCollapsed ? "w-14" : "w-60"
      )}
      aria-label="Main navigation"
    >
      {/* Logo / Brand */}
      <div
        className={cn(
          "flex items-center border-b border-[#1e2d3d] flex-shrink-0",
          sidebarCollapsed ? "h-12 justify-center px-0" : "h-12 gap-2.5 px-4"
        )}
      >
        {/* Logo mark */}
        <div className="flex-shrink-0 w-6 h-6 rounded bg-[#1d4ed8] flex items-center justify-center">
          <Cpu className="w-3.5 h-3.5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <div className="text-[#e2e8f0] text-sm font-semibold leading-none tracking-tight">
              ULPF
            </div>
            <div className="text-[#374151] text-[9px] font-mono tracking-widest uppercase mt-0.5">
              Log Intelligence
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-thin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-1">
            {/* Group label */}
            {!sidebarCollapsed && (
              <div className="px-2 py-1.5 text-[#374151] text-[9px] font-semibold uppercase tracking-widest">
                {group.label}
              </div>
            )}
            {sidebarCollapsed && (
              <div className="h-px bg-[#1e2d3d] my-1 mx-1" />
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = activeHref === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group z-10",
                    active ? "text-[#e2e8f0]" : "text-[#94a3b8] hover:text-[#e2e8f0]",
                    sidebarCollapsed && "justify-center px-0 w-10 mx-auto"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <motion.div
                      layoutId="active-nav-item"
                      className="absolute inset-0 bg-[#1e2d3d]/50 rounded-lg -z-10 border border-[#3b82f6]/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      "w-4 h-4 flex-shrink-0 transition-colors z-10",
                      active ? "text-[#3b82f6]" : "text-[#64748b] group-hover:text-[#94a3b8]"
                    )}
                  />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 truncate z-10">{item.label}</span>
                      {item.badge && (
                        <span
                          className="flex-shrink-0 text-[9px] font-bold font-mono px-1 py-0.5 rounded z-10"
                          style={{
                            backgroundColor: `${item.badgeColor}22`,
                            color: item.badgeColor,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer — system health indicator + collapse */}
      <div className="flex-shrink-0 border-t border-[#1e2d3d] p-2">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
            <StatusDot status="degraded" size="xs" pulse={false} />
            <span className="text-[#64748b] text-[10px] font-mono">1 service degraded</span>
          </div>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            "flex items-center justify-center rounded transition-colors text-[#374151] hover:text-[#64748b] hover:bg-[#0d1117]",
            sidebarCollapsed ? "w-10 h-7 mx-auto" : "w-full h-7 gap-2"
          )}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <>
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
