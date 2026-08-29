"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { ServerOff, RefreshCw, AlertTriangle } from "lucide-react";

interface BackendErrorStateProps {
  title?: string;
  description?: string;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

export function BackendErrorState({
  title = "Could not connect to backend",
  description = "We couldn’t reach the ZeroTrace API. Make sure the backend service is running and try again.",
  error,
  onRetry,
  className,
}: BackendErrorStateProps) {
  const isOffline =
    error instanceof Error &&
    (/could not connect|backend|offline|network|fetch/i.test(error.message) ||
      error.name === "BackendError");

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#ef4444]/30 bg-[#450a0a]">
        {isOffline ? (
          <ServerOff className="h-5 w-5 text-[#fca5a5]" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-[#fca5a5]" />
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-[#fca5a5]">{title}</p>
        <p className="max-w-xs text-xs text-[#94a3b8]">{description}</p>
        {error && error.message && (
          <p className="mt-2 max-w-sm rounded border border-[#1e2d3d] bg-[#050709] px-2 py-1.5 text-[10px] font-mono text-[#64748b]">
            {error.message}
          </p>
        )}
      </div>
      {onRetry && (
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}

interface PageErrorStateProps {
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

export function PageErrorState({ error, onRetry, className }: PageErrorStateProps) {
  return (
    <div className={cn("flex h-full flex-col bg-[#050709]", className)}>
      <BackendErrorState
        title={
          error && /could not connect|backend|offline|network|fetch/i.test(error.message)
            ? "Could not connect to backend"
            : "Failed to load data"
        }
        description={
          error && /could not connect|backend|offline|network|fetch/i.test(error.message)
            ? "The ZeroTrace backend appears to be offline. Please start the backend service and retry."
            : "Something went wrong while loading this page. Try refreshing or contact support if the issue persists."
        }
        error={error}
        onRetry={onRetry}
      />
    </div>
  );
}
