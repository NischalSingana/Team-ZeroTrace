import { cn } from "@/lib/utils/cn";
import { Sparkline } from "./sparkline";
import { formatDelta, deltaDirection } from "@/lib/utils/format";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  sparkData?: number[];
  sparkColor?: string;
  description?: string;
  className?: string;
  emphasis?: boolean;
  valueColor?: string;
}

import { motion } from "framer-motion";

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export function MetricCard({
  label,
  value,
  unit,
  delta,
  sparkData,
  sparkColor = "#3b82f6",
  description,
  className,
  emphasis = false,
  valueColor,
}: MetricCardProps) {
  const dir = delta !== undefined ? deltaDirection(delta) : "flat";

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "flex flex-col gap-1 border border-[#1e2d3d] bg-[#0d1117] rounded p-3 min-w-0 transition-colors hover:bg-[#151b23] hover:border-[#3b82f6]/30",
        emphasis && "border-[#243044]",
        className
      )}
    >
      <span className="text-[#64748b] text-[10px] font-medium uppercase tracking-widest truncate">
        {label}
      </span>

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <span
            className="font-mono text-xl font-semibold tracking-tight leading-none"
            style={{ color: valueColor ?? "#e2e8f0" }}
          >
            {value}
          </span>
          {unit && (
            <span className="ml-1 text-[#64748b] text-xs font-mono">{unit}</span>
          )}
        </div>
        {sparkData && sparkData.length > 0 && (
          <Sparkline
            data={sparkData}
            width={64}
            height={20}
            color={sparkColor}
          />
        )}
      </div>

      {(delta !== undefined || description) && (
        <div className="flex items-center gap-1.5 min-w-0">
          {delta !== undefined && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-[10px] font-mono font-medium",
                dir === "up" && "text-[#86efac]",
                dir === "down" && "text-[#fca5a5]",
                dir === "flat" && "text-[#64748b]"
              )}
            >
              {dir === "up" && <TrendingUp className="w-2.5 h-2.5" />}
              {dir === "down" && <TrendingDown className="w-2.5 h-2.5" />}
              {dir === "flat" && <Minus className="w-2.5 h-2.5" />}
              {formatDelta(delta)}
            </span>
          )}
          {description && (
            <span className="text-[#64748b] text-[10px] truncate">{description}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
