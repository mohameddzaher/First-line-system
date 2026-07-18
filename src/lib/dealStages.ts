import type { BadgeTone } from "@/components/ui/Badge";
import type { Locale } from "@/i18n/dictionaries";

/**
 * Deal stages, shared by the pipeline board and the deal detail page so the two
 * views can never disagree about what a stage is called or how it looks.
 */
export const DEAL_STAGE_META: Record<string, [string, string, BadgeTone]> = {
  lead: ["عميل محتمل", "Lead", "info"],
  qualified: ["مؤهّل", "Qualified", "info"],
  proposal: ["عرض سعر", "Proposal", "warning"],
  negotiation: ["تفاوض", "Negotiation", "accent"],
  won: ["مكسوبة", "Won", "success"],
  lost: ["خاسرة", "Lost", "danger"],
};

/** Ordered progression. `won`/`lost` are the two terminal outcomes. */
export const DEAL_PROGRESSION = ["lead", "qualified", "proposal", "negotiation"] as const;
export const DEAL_OUTCOMES = ["won", "lost"] as const;

export function dealStageLabel(stage: string, locale: Locale): string {
  const meta = DEAL_STAGE_META[stage];
  return meta ? (locale === "ar" ? meta[0] : meta[1]) : stage;
}

export function dealStageTone(stage: string): BadgeTone {
  return DEAL_STAGE_META[stage]?.[2] ?? "neutral";
}
