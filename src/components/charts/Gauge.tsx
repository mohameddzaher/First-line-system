"use client";

import { cssColor } from "@/components/charts/Donut";

/** Radial progress gauge — attainment %, utilisation, etc. */
export function Gauge({
  value,
  max = 100,
  label,
  color = "primary",
  size = 160,
}: {
  value: number;
  max?: number;
  label?: string;
  color?: string;
  size?: number;
}) {
  const pct = Math.min(1, max > 0 ? value / max : 0);
  const thickness = 14;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  // 270° arc (gap at the bottom).
  const arc = 0.75;
  const circ = 2 * Math.PI * r;
  const shown = circ * arc;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[135deg]">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={thickness} strokeDasharray={`${shown} ${circ}`} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={cssColor(color)} strokeWidth={thickness} strokeDasharray={`${shown * pct} ${circ}`} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular text-fg">{Math.round(pct * 100)}%</span>
        {label && <span className="mt-0.5 text-xs text-fg-muted">{label}</span>}
      </div>
    </div>
  );
}
