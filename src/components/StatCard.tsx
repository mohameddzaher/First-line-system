import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BadgeTone } from "@/components/ui/Badge";

const TONE_ACCENT: Record<BadgeTone, string> = {
  neutral: "text-fg",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
  accent: "text-accent",
};

export function StatCard({
  label,
  value,
  tone = "neutral",
  icon,
  hint,
  delta,
  href,
}: {
  label: string;
  value: string | number;
  tone?: BadgeTone;
  icon?: React.ReactNode;
  hint?: string;
  delta?: { value: string; direction: "up" | "down" };
  /** When set, the whole card becomes a link to a (usually filtered) page. */
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{label}</p>
        {icon && <span className="text-fg-subtle">{icon}</span>}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <p className={cn("text-3xl font-bold tabular", TONE_ACCENT[tone])}>{value}</p>
        {delta && (
          <span
            className={cn(
              "mb-1 text-xs font-medium tabular",
              delta.direction === "up" ? "text-success" : "text-danger",
            )}
          >
            {delta.direction === "up" ? "▲" : "▼"} {delta.value}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-fg-subtle">{hint}</p>}
    </>
  );

  const base = "block rounded-xl bg-surface p-5 ring-1 ring-border shadow-card transition-all";
  if (href) {
    return (
      <Link href={href} className={cn(base, "group hover:-translate-y-0.5 hover:shadow-raised hover:ring-primary/30")}>
        {inner}
        <span className="mt-2 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          <span className="rtl:hidden">View</span>
          <span className="ltr:hidden">عرض</span>
          <ArrowLeft className="size-3 rtl:rotate-180" aria-hidden />
        </span>
      </Link>
    );
  }
  return <div className={cn(base, "hover:shadow-raised")}>{inner}</div>;
}

/** Compact stat for dense dashboard grids. Clickable when `href` is set. */
export function MiniStat({
  label,
  value,
  tone = "neutral",
  href,
}: {
  label: string;
  value: string | number;
  tone?: BadgeTone;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-xs text-fg-muted">{label}</p>
      <p className={cn("mt-1 text-xl font-bold tabular", TONE_ACCENT[tone])}>{value}</p>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="block rounded-lg bg-bg-subtle p-3 ring-1 ring-transparent transition-all hover:bg-surface-hover hover:ring-primary/25">
        {inner}
      </Link>
    );
  }
  return <div className="rounded-lg bg-bg-subtle p-3">{inner}</div>;
}
