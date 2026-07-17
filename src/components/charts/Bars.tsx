"use client";

import { cssColor } from "@/components/charts/Donut";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

/** Horizontal ranked bars — ideal for "by department / nationality / project". */
export function HBars({ data, color = "primary", unit }: { data: BarDatum[]; color?: string; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.length === 0 && <p className="text-sm text-fg-subtle">—</p>}
      {data.map((d, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate text-fg">{d.label}</span>
            <span className="tabular font-medium text-fg-muted">
              {d.value}
              {unit ? ` ${unit}` : ""}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-bg-subtle">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: cssColor(d.color ?? color) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Vertical bar chart for period comparisons (e.g. monthly counts). */
export function VBars({ data, color = "primary", height = 180 }: { data: BarDatum[]; color?: string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md transition-all duration-700 hover:opacity-80"
              style={{ height: `${(d.value / max) * 100}%`, backgroundColor: cssColor(d.color ?? color), minHeight: d.value > 0 ? 4 : 0 }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <span className="w-full truncate text-center text-[10px] text-fg-subtle">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
