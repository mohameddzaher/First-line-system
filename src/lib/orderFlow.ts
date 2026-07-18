import type { BadgeTone } from "@/components/ui/Badge";
import type { Locale } from "@/i18n/dictionaries";

/**
 * The order lifecycle, shared by the orders list and the order detail page so
 * both offer exactly the same transitions. Duplicating this was how the two
 * views would have drifted apart.
 */
export const ORDER_STATUS_META: Record<string, [string, string, BadgeTone]> = {
  new: ["جديد", "New", "neutral"],
  assigned: ["مُسنَد", "Assigned", "info"],
  picked_up: ["تم الاستلام", "Picked Up", "info"],
  in_transit: ["قيد التوصيل", "In Transit", "warning"],
  delivered: ["تم التوصيل", "Delivered", "success"],
  failed: ["فشل", "Failed", "danger"],
  returned: ["مُرتجع", "Returned", "warning"],
  cancelled: ["ملغى", "Cancelled", "neutral"],
};

/** Allowed next statuses. A status absent here is terminal. */
export const ORDER_FLOW: Record<string, string[]> = {
  new: ["assigned", "cancelled"],
  assigned: ["picked_up", "cancelled"],
  picked_up: ["in_transit", "failed"],
  in_transit: ["delivered", "failed", "returned"],
};

/** The happy path, used to draw progress. Exception states sit outside it. */
export const ORDER_HAPPY_PATH = ["new", "assigned", "picked_up", "in_transit", "delivered"] as const;

export function orderStatusLabel(status: string, locale: Locale): string {
  const meta = ORDER_STATUS_META[status];
  return meta ? (locale === "ar" ? meta[0] : meta[1]) : status;
}

export function orderStatusTone(status: string): BadgeTone {
  return ORDER_STATUS_META[status]?.[2] ?? "neutral";
}

export function nextStatuses(status: string): string[] {
  return ORDER_FLOW[status] ?? [];
}
