import { cn } from "@/lib/utils/cn";

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("rounded animate-shimmer", className)}
      style={{ minHeight: "12px" }}
      aria-hidden="true"
    />
  );
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 py-2 px-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-3 rounded",
            i === 0 ? "w-16" : i === 1 ? "w-32" : i === 2 ? "w-24" : "flex-1"
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonBlock({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonMetric() {
  return (
    <div className="space-y-2 p-4 border border-[#1e2d3d] rounded">
      <Skeleton className="h-2 w-20" />
      <Skeleton className="h-6 w-28" />
      <Skeleton className="h-2 w-16" />
    </div>
  );
}
