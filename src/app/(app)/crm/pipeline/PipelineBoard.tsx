"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/provider";
import { DEAL_STAGE_META } from "@/lib/dealStages";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/dictionaries";

export interface PipelineDeal {
  _id: string;
  title: string;
  stage: string;
  value: number;
  probability: number;
  company?: { name: string } | null;
  owner?: { firstName: string; lastName: string } | null;
}

// Stage metadata lives in lib/dealStages so the deal detail page matches.
const STAGES = Object.entries(DEAL_STAGE_META).map(
  ([key, [ar, en, tone]]) => [key, ar, en, tone] as const,
);

const TONE_BAR: Record<string, string> = { info: "bg-info", warning: "bg-warning", accent: "bg-accent", success: "bg-success", danger: "bg-danger" };

/**
 * Kanban pipeline. Cards are draggable between stage columns; dropping a card
 * PATCHes the deal's stage (which also stamps won/lost close dates server-side).
 */
export function PipelineBoard({ locale, deals: initial }: { locale: Locale; deals: PipelineDeal[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const ar = locale === "ar";
  const [deals, setDeals] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  const move = async (id: string, stage: string) => {
    const deal = deals.find((d) => d._id === id);
    if (!deal || deal.stage === stage) return;
    const prev = deal.stage;
    // Optimistic update.
    setDeals((ds) => ds.map((d) => (d._id === id ? { ...d, stage } : d)));
    try {
      const res = await fetch(`/api/crm/deals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }) });
      if (!res.ok) throw new Error();
      toast.success(ar ? "تم نقل الصفقة" : "Deal moved");
      router.refresh();
    } catch {
      setDeals((ds) => ds.map((d) => (d._id === id ? { ...d, stage: prev } : d)));
      toast.error(t("common.somethingWentWrong"));
    }
  };

  return (
    <>
      <PageHeader
        title={ar ? "خط أنابيب المبيعات" : "Sales Pipeline"}
        description={ar ? "اسحب الصفقة بين المراحل لتحديثها" : "Drag a deal between stages to update it"}
      />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(([key, arL, enL, tone]) => {
          const col = deals.filter((d) => d.stage === key);
          const total = col.reduce((s, d) => s + (d.value || 0), 0);
          return (
            <div
              key={key}
              onDragOver={(e) => { e.preventDefault(); setOverStage(key); }}
              onDragLeave={() => setOverStage((s) => (s === key ? null : s))}
              onDrop={() => { if (dragId) move(dragId, key); setDragId(null); setOverStage(null); }}
              className={cn(
                "flex w-72 shrink-0 flex-col rounded-xl bg-bg-subtle ring-1 transition-colors",
                overStage === key ? "ring-primary" : "ring-border",
              )}
            >
              <div className="flex items-center justify-between gap-2 border-b border-border p-3">
                <div className="flex items-center gap-2">
                  <span className={cn("size-2.5 rounded-full", TONE_BAR[tone])} />
                  <span className="text-sm font-semibold text-fg">{ar ? arL : enL}</span>
                  <span className="rounded-full bg-surface px-1.5 text-xs tabular text-fg-muted">{col.length}</span>
                </div>
                <span className="text-xs tabular text-fg-muted">{formatCurrency(total, locale)}</span>
              </div>

              <div className="flex min-h-24 flex-1 flex-col gap-2 p-2">
                {col.length === 0 && <p className="p-3 text-center text-xs text-fg-subtle">—</p>}
                {col.map((d) => (
                  <div
                    key={d._id}
                    draggable
                    onDragStart={() => setDragId(d._id)}
                    onDragEnd={() => { setDragId(null); setOverStage(null); }}
                    className={cn(
                      "cursor-grab rounded-lg bg-surface p-3 shadow-card ring-1 ring-border transition-all active:cursor-grabbing",
                      dragId === d._id ? "opacity-50" : "hover:shadow-raised",
                    )}
                  >
                    <div className={cn("mb-2 h-1 w-8 rounded-full", TONE_BAR[tone])} />
                    <p className="text-sm font-medium text-fg">{d.title}</p>
                    {d.company?.name && <p className="mt-0.5 text-xs text-fg-muted">{d.company.name}</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold tabular text-fg">{formatCurrency(d.value, locale)}</span>
                      <span className="text-xs text-fg-subtle tabular">{d.probability}%</span>
                    </div>
                    {d.owner && <p className="mt-1 text-[11px] text-fg-subtle">{d.owner.firstName} {d.owner.lastName}</p>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
