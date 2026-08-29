"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getPipelineMetrics } from "@/lib/services/pipeline";
import { getRecentEvents } from "@/lib/services/events";
import { useUIStore } from "@/lib/store/ui";
import { useInterval } from "@/lib/utils/hooks";
import type { PipelineMetrics, NormalizedEvent } from "@/lib/types";
import { RefreshCw, Pause, Play, Settings2 } from "lucide-react";
import { PipelineCanvas, LiveStream, EventInspector } from "./components";

// ════════════════════════════════════════════════════════════════
// Pipeline Page (Stage 3)
// ════════════════════════════════════════════════════════════════


export default function PipelinePage() {
  const { liveFeedActive, toggleLiveFeed } = useUIStore();
  const [pipeline, setPipeline] = useState<PipelineMetrics | null>(null);
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [pipe, evts] = await Promise.all([
      getPipelineMetrics(),
      getRecentEvents(50),
    ]);
    setPipeline(pipe);
    setEvents(evts);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch; state updates happen after await
    void load();
  }, [load]);
  useInterval(load, liveFeedActive ? 2000 : null);

  const selectedEvent = events.find(e => e.id === selectedEventId) || null;

  const handleSelectEvent = (evt: NormalizedEvent) => {
    setSelectedEventId(evt.id);
    if (liveFeedActive) {
      toggleLiveFeed(); // Pause the stream when selecting an event to inspect
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050709]">
      <PageHeader
        title="Live Log Pipeline"
        description="SIH Command Center: Real-time event tracing and processing visualization"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              leftIcon={<Settings2 className="w-3 h-3" />}
            >
              1x Rate
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={load}
              leftIcon={<RefreshCw className="w-3 h-3" />}
            >
              Refresh
            </Button>
            <Button
              variant={liveFeedActive ? "subtle" : "ghost"}
              size="xs"
              onClick={toggleLiveFeed}
              leftIcon={liveFeedActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              className={liveFeedActive ? "text-[#86efac] border-[#22c55e]/20 bg-[#052e16]" : ""}
            >
              {liveFeedActive ? "STREAMING" : "PAUSED"}
            </Button>
          </div>
        }
      />

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Event Stream */}
        <LiveStream 
          events={events} 
          selectedId={selectedEventId} 
          onSelect={handleSelectEvent} 
        />
        
        {/* Center: Visual Pipeline */}
        <div className="flex-1 overflow-hidden min-w-[500px]">
          <PipelineCanvas 
             metrics={pipeline} 
             selectedEvent={selectedEvent} 
          />
        </div>

        {/* Right: Inspector */}
        <EventInspector event={selectedEvent} />
      </div>
    </div>
  );
}
