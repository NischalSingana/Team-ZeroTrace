"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { SeverityBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getEventById } from "@/lib/services/events";
import type { NormalizedEvent } from "@/lib/types";
import { XCircle, ArrowLeft, Copy, Activity } from "lucide-react";
import { ForensicTimeline, MappingCanvas } from "./components";

export default function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const [event, setEvent] = useState<NormalizedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    params.then(({ eventId }) => {
      getEventById(eventId).then((e) => {
        if (e) {
          setEvent(e);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      });
    });
  }, [params]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#050709]">
        <div className="px-6 py-4 border-b border-[#1e2d3d]">
          <Skeleton className="h-4 w-64 mb-2 bg-[#1e2d3d]" />
          <Skeleton className="h-3 w-40 bg-[#1e2d3d]" />
        </div>
        <div className="p-6 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-[#1e2d3d]" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-[#050709]">
        <XCircle className="w-10 h-10 text-[#374151]" />
        <div className="text-[#94a3b8] text-sm">Event not found</div>
        <Link href="/explorer">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-3 h-3" />}>
            Back to Explorer
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#050709] overflow-hidden">
      <PageHeader
        title={`Forensic Lineage: ${event.id}`}
        description={`${event.source_name} · ${event.category.replace(/_/g, " ")}`}
        badge={<SeverityBadge severity={event.severity} size="sm" />}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/explorer">
              <Button variant="ghost" size="xs" leftIcon={<ArrowLeft className="w-3 h-3" />}>
                Explorer
              </Button>
            </Link>
            <Button
              variant="outline"
              size="xs"
              leftIcon={<Copy className="w-3 h-3" />}
              onClick={() => navigator.clipboard.writeText(JSON.stringify(event, null, 2))}
            >
              Export JSON
            </Button>
          </div>
        }
      />

      <div className="flex-1 flex flex-col min-h-0">
         {/* Top Section: Processing Timeline */}
         <div className="flex-shrink-0">
           <div className="px-6 py-3 border-b border-[#1e2d3d] bg-[#0a0d12] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#3b82f6]" />
                <h3 className="text-[#e2e8f0] text-sm font-semibold tracking-tight">Processing Pipeline</h3>
              </div>
           </div>
           <ForensicTimeline lineage={event.lineage} />
         </div>

         {/* Main Section: 3-Pane Mapping Canvas */}
         <MappingCanvas event={event} />
      </div>
    </div>
  );
}
