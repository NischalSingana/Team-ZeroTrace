"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SeverityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Timestamp } from "@/components/ui/timestamp";
import { Kbd } from "@/components/ui/kbd";
import { searchEvents } from "@/lib/services/events";
import { fetchSources } from "@/lib/services/sources";
import {
  formatNumber,
} from "@/lib/utils/format";
import type {
  NormalizedEvent,
  Severity,
  EventCategory,
  LogSource,
  SearchQuery,
} from "@/lib/types";
import {
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { EventInspectorPane } from "./inspector";

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info", "unknown"];
const OUTCOMES = ["success", "failure", "blocked"];
const FORMATS = ["json_lines", "syslog_rfc3164", "syslog_rfc5424", "cef", "leef", "combined", "windows_evtx", "w3c_extended"];

// ── Sort header ──────────────────────────────────────────────────
function SortHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
  className,
}: {
  label: string;
  field: string;
  currentSort: string;
  currentDir: "asc" | "desc";
  onSort: (f: string) => void;
  className?: string;
}) {
  const active = currentSort === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        "flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest transition-colors hover:text-[#94a3b8]",
        active ? "text-[#94a3b8]" : "text-[#374151]",
        className
      )}
    >
      {label}
      {active ? (
        currentDir === "desc" ? (
          <ChevronDown className="w-2.5 h-2.5" />
        ) : (
          <ChevronUp className="w-2.5 h-2.5" />
        )
      ) : (
        <ChevronsUpDown className="w-2.5 h-2.5 opacity-30" />
      )}
    </button>
  );
}

// ── Event Table Row ──────────────────────────────────────────────
function EventTableRow({
  event,
  selected,
  onSelect,
}: {
  event: NormalizedEvent;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <tr
      onClick={onSelect}
      className={cn(
        "border-b border-[#1e2d3d]/50 cursor-pointer transition-colors whitespace-nowrap",
        selected
          ? "bg-[#1c2433] border-l-2 border-l-[#3b82f6]"
          : "hover:bg-[#0d1117] border-l-2 border-l-transparent"
      )}
      tabIndex={0}
      role="row"
      aria-selected={selected}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
    >
      <td className="py-1.5 px-3 align-middle">
        <Timestamp iso={event.timestamp} className="text-[10px]" />
      </td>
      <td className="py-1.5 px-3 align-middle">
        <SeverityBadge severity={event.severity} size="xs" />
      </td>
      <td className="py-1.5 px-3 align-middle max-w-[120px]">
        <span className="text-[#94a3b8] text-xs truncate block font-mono">
          {event.source_name.split("—")[0].trim()}
        </span>
      </td>
      <td className="py-1.5 px-3 align-middle max-w-[150px]">
        <span className="text-[#e2e8f0] text-xs font-mono truncate block">
          {event.action}
        </span>
      </td>
      <td className="py-1.5 px-3 align-middle">
        <span className="text-[#64748b] text-xs font-mono truncate block max-w-[120px]">
          {event.actor.user ?? event.actor.ip ?? "—"}
        </span>
      </td>
      <td className="py-1.5 px-3 align-middle">
        <span className="text-[#64748b] text-xs font-mono truncate block max-w-[120px]">
          {event.target.ip ?? "—"}
        </span>
      </td>
      <td className="py-1.5 px-3 align-middle">
        <span className="text-[#3b82f6] text-[10px] font-mono truncate block max-w-[120px]">
          {event.parser_id.replace("parser_", "")}
        </span>
      </td>
      <td className="py-1.5 px-3 align-middle">
        <div className="flex items-center gap-1.5">
          <div className={cn("w-1.5 h-1.5 rounded-full", event.lineage.some(l => l.status === 'error') ? "bg-[#ef4444]" : "bg-[#22c55e]")} />
          <span className="text-[#64748b] text-[10px] font-mono">
             {event.lineage.some(l => l.status === 'error') ? "Error" : "Success"}
          </span>
        </div>
      </td>
    </tr>
  );
}

// ── Filter Chip ──────────────────────────────────────────────────
function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1c2433] border border-[#243044] text-[#94a3b8] text-[10px] font-mono">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="text-[#64748b] hover:text-[#e2e8f0] ml-0.5 transition-colors"
        aria-label={`Remove filter: ${label}`}
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

// ════════════════════════════════════════════════════════════════
// Log Explorer Page
// ════════════════════════════════════════════════════════════════

const PAGE_SIZE = 50;

function ExplorerInner() {
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  const [searchText, setSearchText] = useState(searchParams.get("q") ?? "");
  const [selectedSeverities, setSelectedSeverities] = useState<Severity[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [results, setResults] = useState<NormalizedEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [queryMs, setQueryMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<LogSource[]>([]);
  
  // Selected event for split pane
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  const [filterOpen, setFilterOpen] = useState(true);

  const doSearch = useCallback(async () => {
    setLoading(true);
    const query: SearchQuery = {
      text: searchText || undefined,
      filters: [],
      time_range: "24h",
      severity: selectedSeverities.length > 0 ? selectedSeverities : undefined,
      source_ids: selectedSourceIds.length > 0 ? selectedSourceIds : undefined,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      page,
      page_size: PAGE_SIZE,
      sort_by: sortBy,
      sort_dir: sortDir,
    };
    const res = await searchEvents(query);
    setResults(res.events);
    setTotal(res.total);
    setQueryMs(res.query_ms);
    setLoading(false);
  }, [searchText, selectedSeverities, selectedCategories, selectedSourceIds, page, sortBy, sortDir]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async search; state updates happen after await
    void doSearch();
  }, [doSearch]);
  useEffect(() => { fetchSources().then(setSources); }, []);

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as Element).tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSort = (field: string) => {
    if (field === sortBy) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(0);
  };

  const toggleFilter = <T,>(setFn: React.Dispatch<React.SetStateAction<T[]>>, val: T) => {
    setFn(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
    setPage(0);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const activeFiltersCount = selectedSeverities.length + selectedCategories.length + selectedSourceIds.length + selectedFormats.length + selectedOutcomes.length;
  const selectedEvent = results.find(e => e.id === selectedEventId) || null;

  return (
    <div className="flex flex-col h-full bg-[#050709] overflow-hidden">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-[#1e2d3d] bg-[#080b0f] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-[#3b82f6]" />
          <div>
            <h1 className="text-lg font-semibold text-[#e2e8f0] tracking-tight">Log Explorer</h1>
            <p className="text-[#64748b] text-xs">High-density investigation environment.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="xs" leftIcon={<Download className="w-3 h-3" />}>Export All</Button>
          <Button
            variant={filterOpen ? "subtle" : "ghost"}
            size="xs"
            onClick={() => setFilterOpen(!filterOpen)}
            leftIcon={<Filter className="w-3 h-3" />}
          >
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
        </div>
      </div>

      {/* ── Search Bar ──────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-[#1e2d3d] bg-[#050709] flex-shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); setPage(0); doSearch(); }}
          className="flex flex-col gap-2"
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 h-10 px-4 rounded border border-[#243044] bg-[#0d1117] focus-within:border-[#3b82f6] focus-within:ring-1 focus-within:ring-[#3b82f6]/50 transition-all shadow-inner">
              <Search className="w-4 h-4 text-[#374151] flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search events…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#e2e8f0] placeholder:text-[#374151] outline-none font-mono min-w-0"
                aria-label="Search events"
              />
              <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                <Kbd>/</Kbd>
              </div>
            </div>
            <Button type="submit" variant="primary" size="md" className="px-8 font-semibold">
              Query
            </Button>
          </div>
          
          <div className="flex items-center gap-3 text-[10px] font-mono text-[#64748b]">
             <span className="text-[#374151] uppercase tracking-widest font-bold">Examples:</span>
             <button type="button" onClick={() => setSearchText("source.ip:192.168.1.50")} className="hover:text-[#94a3b8] transition-colors border border-[#1e2d3d] rounded px-1.5 py-0.5 bg-[#0d1117]">source.ip:192.168.1.50</button>
             <button type="button" onClick={() => setSearchText("event.action:login_failure")} className="hover:text-[#94a3b8] transition-colors border border-[#1e2d3d] rounded px-1.5 py-0.5 bg-[#0d1117]">event.action:login_failure</button>
             <button type="button" onClick={() => setSearchText("severity:high outcome:blocked")} className="hover:text-[#94a3b8] transition-colors border border-[#1e2d3d] rounded px-1.5 py-0.5 bg-[#0d1117]">severity:high outcome:blocked</button>
          </div>

          {/* Active filter chips */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[#374151] text-[9px] font-mono uppercase tracking-widest mr-1">Active:</span>
              {selectedSeverities.map((s) => (
                <FilterChip key={s} label={`severity:${s}`} onRemove={() => toggleFilter(setSelectedSeverities, s)} />
              ))}
              {selectedFormats.map((f) => (
                <FilterChip key={f} label={`format:${f}`} onRemove={() => toggleFilter(setSelectedFormats, f)} />
              ))}
              {selectedOutcomes.map((o) => (
                <FilterChip key={o} label={`outcome:${o}`} onRemove={() => toggleFilter(setSelectedOutcomes, o)} />
              ))}
              <button
                type="button"
                onClick={() => {
                  setSelectedSeverities([]);
                  setSelectedCategories([]);
                  setSelectedSourceIds([]);
                  setSelectedFormats([]);
                  setSelectedOutcomes([]);
                }}
                className="text-[#64748b] hover:text-[#e2e8f0] text-[10px] font-mono transition-colors ml-2 border border-transparent hover:border-[#1e2d3d] rounded px-1"
              >
                Clear all
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* ── Filter Rail (Left) ────────────────────────────────── */}
        {filterOpen && (
          <aside
            className="w-56 flex-shrink-0 border-r border-[#1e2d3d] overflow-y-auto bg-[#050709] p-4 space-y-6"
            aria-label="Filters"
          >
            {/* Severity */}
            <div>
              <div className="text-[#94a3b8] text-[10px] font-semibold uppercase tracking-widest mb-3">Severity</div>
              <div className="space-y-1.5">
                {SEVERITIES.map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedSeverities.includes(s)}
                      onChange={() => toggleFilter(setSelectedSeverities, s)}
                      className="w-3.5 h-3.5 rounded border border-[#243044] bg-[#0d1117] accent-[#3b82f6] cursor-pointer"
                    />
                    <SeverityBadge severity={s} size="xs" showDot />
                  </label>
                ))}
              </div>
            </div>

            {/* Outcome */}
            <div>
              <div className="text-[#94a3b8] text-[10px] font-semibold uppercase tracking-widest mb-3">Outcome</div>
              <div className="space-y-1.5">
                {OUTCOMES.map((o) => (
                  <label key={o} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedOutcomes.includes(o)}
                      onChange={() => toggleFilter(setSelectedOutcomes, o)}
                      className="w-3.5 h-3.5 rounded border border-[#243044] bg-[#0d1117] accent-[#3b82f6] cursor-pointer"
                    />
                    <span className="text-[#94a3b8] group-hover:text-[#e2e8f0] text-xs font-mono capitalize transition-colors">{o}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <div className="text-[#94a3b8] text-[10px] font-semibold uppercase tracking-widest mb-3">Format</div>
              <div className="space-y-1.5">
                {FORMATS.map((f) => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedFormats.includes(f)}
                      onChange={() => toggleFilter(setSelectedFormats, f)}
                      className="w-3.5 h-3.5 rounded border border-[#243044] bg-[#0d1117] accent-[#3b82f6] cursor-pointer"
                    />
                    <span className="text-[#94a3b8] group-hover:text-[#e2e8f0] text-xs font-mono truncate transition-colors">{f}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Source */}
            <div>
              <div className="text-[#94a3b8] text-[10px] font-semibold uppercase tracking-widest mb-3">Source</div>
              <div className="space-y-1.5">
                {sources.slice(0, 8).map((src) => (
                  <label key={src.id} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedSourceIds.includes(src.id)}
                      onChange={() => toggleFilter(setSelectedSourceIds, src.id)}
                      className="w-3.5 h-3.5 rounded border border-[#243044] bg-[#0d1117] accent-[#3b82f6] cursor-pointer"
                    />
                    <span className="text-[#94a3b8] group-hover:text-[#e2e8f0] text-xs font-mono truncate transition-colors">
                      {src.name.split("—")[0].trim()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* ── Results Table (Center) ────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0d1117]">
          
          {/* Results meta */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e2d3d] bg-[#050709] flex-shrink-0">
            <span className="text-[#64748b] text-[10px] font-mono">
              {loading ? "Executing query…" : (
                <>
                  <span className="text-[#e2e8f0] font-medium">{formatNumber(total)}</span> events matched
                  {queryMs > 0 && <span className="text-[#374151] ml-2">in {queryMs}ms</span>}
                </>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[#374151] text-[10px] font-mono hidden sm:block">
                Page {page + 1} of {totalPages || 1}
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse" role="grid">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#050709] border-b border-[#1e2d3d]">
                  <th className="py-2 px-3 text-left w-36 whitespace-nowrap">
                    <SortHeader label="Timestamp" field="timestamp" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="py-2 px-3 text-left w-20 whitespace-nowrap">
                    <SortHeader label="Sev." field="severity" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="py-2 px-3 text-left w-32 whitespace-nowrap">
                    <span className="text-[#374151] text-[9px] font-mono uppercase tracking-widest">Source</span>
                  </th>
                  <th className="py-2 px-3 text-left whitespace-nowrap">
                    <span className="text-[#374151] text-[9px] font-mono uppercase tracking-widest">Event Action</span>
                  </th>
                  <th className="py-2 px-3 text-left w-32 whitespace-nowrap">
                    <span className="text-[#374151] text-[9px] font-mono uppercase tracking-widest">User/Src IP</span>
                  </th>
                  <th className="py-2 px-3 text-left w-32 whitespace-nowrap">
                    <span className="text-[#374151] text-[9px] font-mono uppercase tracking-widest">Dest IP</span>
                  </th>
                  <th className="py-2 px-3 text-left w-28 whitespace-nowrap">
                    <span className="text-[#374151] text-[9px] font-mono uppercase tracking-widest">Parser</span>
                  </th>
                  <th className="py-2 px-3 text-left w-24 whitespace-nowrap">
                    <span className="text-[#374151] text-[9px] font-mono uppercase tracking-widest">Status</span>
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {loading ? (
                  Array.from({ length: 25 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#1e2d3d]/30">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="py-2.5 px-3">
                          <div className="h-2 rounded bg-[#1e2d3d]/50 animate-pulse" style={{ width: `${[65, 42, 78, 35, 58, 48, 70, 52][(i + j) % 8]}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : results.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-32 gap-3">
                        <Search className="w-8 h-8 text-[#1e2d3d]" />
                        <div className="text-[#94a3b8] text-sm font-medium">No events found matching your query</div>
                        <div className="text-[#64748b] text-xs font-mono">Try adjusting your time range or filters</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  results.map((event) => (
                    <EventTableRow
                      key={event.id}
                      event={event}
                      selected={selectedEventId === event.id}
                      onSelect={() => setSelectedEventId(prev => prev === event.id ? null : event.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-[#1e2d3d] bg-[#050709] flex-shrink-0">
            <span className="text-[#64748b] text-[10px] font-mono">
              Showing {Math.min(page * PAGE_SIZE + 1, total)}–
              {Math.min((page + 1) * PAGE_SIZE, total)} of {formatNumber(total)}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                leftIcon={<ChevronLeft className="w-3 h-3" />}
                className="bg-[#0d1117]"
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                rightIcon={<ChevronRight className="w-3 h-3" />}
                className="bg-[#0d1117]"
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* ── Split Pane Inspector (Right) ──────────────────────── */}
        {selectedEventId && (
           <EventInspectorPane 
              event={selectedEvent} 
              onClose={() => setSelectedEventId(null)} 
           />
        )}

      </div>
    </div>
  );
}

export default function ExplorerPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full text-[#64748b] text-sm font-mono">Initializing Explorer...</div>}>
      <ExplorerInner />
    </Suspense>
  );
}
