import { cn } from "@/lib/utils/cn";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  meta,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-6 py-4 border-b border-[#1e2d3d] bg-[#080b0f] flex-shrink-0",
        className
      )}
    >
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-[10px] font-mono text-[#64748b] mb-1.5" aria-label="Breadcrumb">
            {breadcrumbs.map((bc, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <div key={bc.label} className="flex items-center gap-1">
                  {bc.href && !isLast ? (
                    <Link href={bc.href} className="hover:text-[#94a3b8] transition-colors">{bc.label}</Link>
                  ) : (
                    <span className={isLast ? "text-[#94a3b8]" : ""}>{bc.label}</span>
                  )}
                  {!isLast && <ChevronRight className="w-3 h-3 text-[#374151]" />}
                </div>
              );
            })}
          </nav>
        )}
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-[#e2e8f0] text-base font-semibold tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-[#64748b] text-xs mt-0.5 max-w-xl">{description}</p>
        )}
        {meta && <div className="mt-1.5">{meta}</div>}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}
