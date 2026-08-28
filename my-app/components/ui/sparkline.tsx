"use client";

import { cn } from "@/lib/utils/cn";
import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  className?: string;
  strokeWidth?: number;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = "#3b82f6",
  fill = true,
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  const points = useMemo(() => {
    if (data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);
    const pad = strokeWidth + 1;
    const h = height - pad * 2;

    const pts = data.map((v, i) => ({
      x: i * step,
      y: pad + h - ((v - min) / range) * h,
    }));

    const line = pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(" ");

    const area = `${line} L${pts[pts.length - 1].x.toFixed(2)},${height} L0,${height} Z`;

    return { line, area, pts };
  }, [data, width, height, strokeWidth]);

  if (!points) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      aria-hidden="true"
    >
      {fill && (
        <path
          d={points.area}
          fill={color}
          fillOpacity={0.12}
        />
      )}
      <path
        d={points.line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      <circle
        cx={points.pts[points.pts.length - 1].x}
        cy={points.pts[points.pts.length - 1].y}
        r={2}
        fill={color}
      />
    </svg>
  );
}
