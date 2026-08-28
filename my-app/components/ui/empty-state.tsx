import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center",
        className
      )}
    >
      {icon && (
        <div className="text-[#374151] mb-1">{icon}</div>
      )}
      <div className="space-y-1">
        <p className="text-[#94a3b8] text-sm font-medium">{title}</p>
        {description && (
          <p className="text-[#64748b] text-xs max-w-xs">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Failed to load",
  description = "An error occurred while loading this data.",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center",
        className
      )}
    >
      <div className="w-8 h-8 rounded-full bg-[#450a0a] border border-[#ef4444]/30 flex items-center justify-center">
        <span className="text-[#ef4444] text-sm">!</span>
      </div>
      <div className="space-y-1">
        <p className="text-[#fca5a5] text-sm font-medium">{title}</p>
        {description && (
          <p className="text-[#94a3b8] text-xs max-w-xs">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
