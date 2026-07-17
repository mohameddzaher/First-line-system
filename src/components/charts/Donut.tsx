"use client";

import { useId } from "react";

export interface DonutSlice {
  label: string;
  value: number;
  color: string; // hsl var name token, e.g. "primary" | "accent" | "success" | any css color
}

/** Donut/pie for distributions. Center shows the total (or a custom label). */
export function Donut({
  data,
  size = 180,
  thickness = 22,
  centerLabel,
  centerValue,
}: {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
}) {
  const id = useId();
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const segments = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const frac = total > 0 ? d.value / total : 0;
      const seg = { ...d, dash: frac * circ, offset };
      offset += frac * circ;
      return seg;
    });

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={thickness} />
          {segments.map((s, i) => (
            <circle
              key={`${id}-${i}`}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={cssColor(s.color)}
              strokeWidth={thickness}
              strokeDasharray={`${s.dash} ${circ - s.dash}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="butt"
              className="transition-all duration-700"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular text-fg">{centerValue ?? total}</span>
          {centerLabel && <span className="text-xs text-fg-muted">{centerLabel}</span>}
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2">
        {data.map((d, i) => (
          <li key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: cssColor(d.color) }} />
              <span className="truncate text-fg-muted">{d.label}</span>
            </span>
            <span className="tabular font-medium text-fg">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Maps a token name to a CSS color; passes through raw colors. */
export function cssColor(c: string): string {
  const tokens = ["primary", "accent", "success", "warning", "danger", "info"];
  if (tokens.includes(c)) return `hsl(var(--${c}))`;
  return c;
}
