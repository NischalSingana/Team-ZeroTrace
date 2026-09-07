"use client";

import Link from "next/link";
import { Bell, Search, Wifi, WifiOff, LogOut } from "lucide-react";
import { useUIStore } from "@/lib/store/ui";
import { Button } from "@/components/ui/button";
import { pauseStream, resumeStream } from "@/lib/services/pipeline";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/utils/cn";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";
import { getApiErrorMessage } from "@/lib/services/api";

interface TopbarProps {
  alertCount?: number;
}

export function Topbar({ alertCount = 5 }: TopbarProps) {
  const { liveFeedActive, toggleLiveFeed } = useUIStore();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    document.cookie = "ulpf-auth-token=; path=/; max-age=0; samesite=strict";
    router.replace("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/explorer?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handleToggleFeed = async () => {
    try {
      if (liveFeedActive) {
        await pauseStream();
      } else {
        await resumeStream();
      }
      toggleLiveFeed();
    } catch (err) {
      console.error("Failed to toggle stream:", err);
      toast.error("Failed to update stream state", {
        description: getApiErrorMessage(err),
      });
    }
  };

  return (
    <header
      className="flex items-center h-12 border-b border-[#1e2d3d] bg-[#080b0f] px-4 gap-3 flex-shrink-0"
      role="banner"
    >
      {/* Global search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div
          className={cn(
            "flex items-center gap-2 h-7 px-2.5 rounded border transition-colors",
            searchFocused
              ? "border-[#3b82f6] bg-[#0d1117]"
              : "border-[#1e2d3d] bg-[#080b0f]"
          )}
        >
          <Search className="w-3.5 h-3.5 text-[#374151] flex-shrink-0" />
          <input
            type="text"
            placeholder="Search events, sources, parsers…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="flex-1 bg-transparent text-xs text-[#e2e8f0] placeholder:text-[#374151] outline-none min-w-0 font-mono"
            aria-label="Global search"
          />
          <kbd className="hidden sm:inline-flex items-center px-1 py-0.5 rounded border border-[#1e2d3d] font-mono text-[9px] text-[#374151]">
            /
          </kbd>
        </div>
      </form>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Environment Indicator */}
      <div className="hidden md:flex items-center">
        <span className="px-1.5 py-0.5 rounded border border-[#ef4444]/30 bg-[#450a0a] text-[#fca5a5] text-[9px] font-mono font-bold tracking-widest uppercase">
          PROD
        </span>
      </div>

      {/* Status indicators */}
      <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono text-[#64748b]">
        <div className="flex items-center gap-1.5">
          <StatusDot status="healthy" size="xs" />
          <span>683/s</span>
        </div>
        <div className="w-px h-3 bg-[#1e2d3d]" />
        <div className="flex items-center gap-1.5">
          <StatusDot status="degraded" size="xs" pulse={false} />
          <span>Enrichment</span>
        </div>
        <div className="w-px h-3 bg-[#1e2d3d]" />
        <span className="text-[#374151]">12 sources</span>
      </div>

      {/* Live feed toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleFeed}
        className={cn(
          "gap-1.5 h-7 text-[10px] font-mono",
          liveFeedActive
            ? "text-[#86efac] border-[#22c55e]/20 bg-[#052e16]"
            : "text-[#64748b]"
        )}
        aria-label={liveFeedActive ? "Pause live feed" : "Start live feed"}
        aria-pressed={liveFeedActive}
      >
        {liveFeedActive ? (
          <Wifi className="w-3.5 h-3.5" />
        ) : (
          <WifiOff className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">
          {liveFeedActive ? "LIVE" : "PAUSED"}
        </span>
      </Button>

      {/* Alerts */}
      <Link
        href="/detections"
        className={cn(
          "relative flex items-center justify-center w-7 h-7 rounded border transition-colors",
          alertCount > 0
            ? "border-[#ef4444]/30 bg-[#450a0a] text-[#fca5a5] hover:bg-[#7f1d1d]"
            : "border-[#1e2d3d] text-[#64748b] hover:text-[#94a3b8] hover:bg-[#0d1117]"
        )}
        aria-label={`${alertCount} active alerts`}
      >
        <Bell className="w-3.5 h-3.5" />
        {alertCount > 0 && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#ef4444] text-white text-[8px] font-bold flex items-center justify-center font-mono">
            {alertCount > 9 ? "9+" : alertCount}
          </span>
        )}
      </Link>

      <div className="w-px h-4 bg-[#1e2d3d]" />

      {/* User profile + logout dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setUserMenuOpen((v) => !v)}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-[#1e2d3d] text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#243044] transition-colors text-[10px] font-bold tracking-wider border border-[#243044]"
          aria-label="User menu"
          aria-expanded={userMenuOpen}
          id="user-menu-button"
        >
          {user?.username ? user.username.slice(0, 2).toUpperCase() : "AD"}
        </button>

        {userMenuOpen && (
          <div
            className="absolute right-0 top-9 z-50 min-w-[160px] rounded-lg border border-[#1e2d3d] bg-[#0d1117] shadow-2xl py-1"
            role="menu"
            aria-labelledby="user-menu-button"
          >
            {user?.username && (
              <div className="px-3 py-2 border-b border-[#1e2d3d]">
                <p className="text-[10px] font-mono text-[#475569] uppercase tracking-widest">Signed in as</p>
                <p className="text-xs font-mono font-semibold text-[#94a3b8] mt-0.5 truncate">{user.username}</p>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-mono text-[#f87171] hover:bg-[#450a0a] transition-colors"
              role="menuitem"
              id="logout-button"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
