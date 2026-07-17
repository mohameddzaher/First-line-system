"use client";

import { useId } from "react";
import { cssColor } from "@/components/charts/Donut";

export interface TrendPoint {
  label: string;
  value: number;
}

/** Smooth area+line trend for time series (e.g. monthly hires, orders, deals). */
export function TrendChart({
  data,
  color = "primary",
  height = 200,
  valuePrefix = "",
}: {
  data: TrendPoint[];
  color?: string;
  height?: number;
  valuePrefix?: string;
}) {
  const id = useId();
  const width = 600;
  const pad = { top: 16, right: 8, bottom: 24, left: 8 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const stroke = cssColor(color);

  const pts = data.map((d, i) => {
    const x = pad.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = pad.top + innerH - (d.value / max) * innerH;
    return { x, y, ...d };
  });

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${pts[pts.length - 1]?.x ?? pad.left},${pad.top + innerH} L${pts[0]?.x ?? pad.left},${pad.top + innerH} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* gridlines */}
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={pad.left} x2={width - pad.right} y1={pad.top + innerH * g} y2={pad.top + innerH * g} stroke="hsl(var(--border))" strokeDasharray="3 4" />
        ))}
        {pts.length > 0 && <path d={area} fill={`url(#grad-${id})`} />}
        {pts.length > 0 && <path d={line} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="hsl(var(--surface))" stroke={stroke} strokeWidth={2}>
            <title>{`${p.label}: ${valuePrefix}${p.value}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-1">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] text-fg-subtle">{d.label}</span>
        ))}
      </div>
    </div>
  );
}
