import type { BadgeTone } from "@/components/ui/Badge";
import type { Locale } from "@/i18n/dictionaries";

interface StatusInfo {
  tone: BadgeTone;
  ar: string;
  en: string;
}

/** Central status vocabulary so a status renders identically everywhere. */
export const STATUS: Record<string, Record<string, StatusInfo>> = {
  employee: {
    active: { tone: "success", ar: "على رأس العمل", en: "Active" },
    on_leave: { tone: "info", ar: "في إجازة", en: "On Leave" },
    suspended: { tone: "warning", ar: "موقوف", en: "Suspended" },
    terminated: { tone: "danger", ar: "منتهية خدمته", en: "Terminated" },
  },
  contract: {
    active: { tone: "success", ar: "ساري", en: "Active" },
    expired: { tone: "danger", ar: "منتهٍ", en: "Expired" },
    terminated: { tone: "neutral", ar: "مُنهى", en: "Terminated" },
    draft: { tone: "neutral", ar: "مسودة", en: "Draft" },
  },
  leave: {
    pending: { tone: "warning", ar: "قيد الموافقة", en: "Pending" },
    approved: { tone: "success", ar: "موافق عليها", en: "Approved" },
    rejected: { tone: "danger", ar: "مرفوضة", en: "Rejected" },
    cancelled: { tone: "neutral", ar: "ملغاة", en: "Cancelled" },
  },
  request: {
    open: { tone: "info", ar: "مفتوح", en: "Open" },
    in_progress: { tone: "warning", ar: "قيد المعالجة", en: "In Progress" },
    resolved: { tone: "success", ar: "تم الحل", en: "Resolved" },
    rejected: { tone: "danger", ar: "مرفوض", en: "Rejected" },
    closed: { tone: "neutral", ar: "مغلق", en: "Closed" },
  },
  custody: {
    assigned: { tone: "info", ar: "مُسلَّمة", en: "Assigned" },
    returned: { tone: "success", ar: "مُرتجعة", en: "Returned" },
    lost: { tone: "danger", ar: "مفقودة", en: "Lost" },
    damaged: { tone: "warning", ar: "تالفة", en: "Damaged" },
    in_stock: { tone: "neutral", ar: "في المستودع", en: "In Stock" },
  },
  task: {
    todo: { tone: "neutral", ar: "قيد الانتظار", en: "To Do" },
    in_progress: { tone: "info", ar: "قيد التنفيذ", en: "In Progress" },
    done: { tone: "success", ar: "مكتمل", en: "Done" },
    cancelled: { tone: "neutral", ar: "ملغى", en: "Cancelled" },
  },
  vehicle: {
    authorized: { tone: "success", ar: "مُفوَّضة", en: "Authorized" },
    available: { tone: "info", ar: "جاهزة", en: "Available" },
    parked: { tone: "neutral", ar: "موقوفة", en: "Parked" },
    maintenance: { tone: "warning", ar: "في الصيانة", en: "In Maintenance" },
    no_plate: { tone: "warning", ar: "بدون لوحة", en: "No Plate" },
    impounded: { tone: "danger", ar: "محتجز عليها", en: "Impounded" },
    withdrawn: { tone: "neutral", ar: "مسحوبة", en: "Withdrawn" },
    stolen: { tone: "danger", ar: "مسروقة", en: "Stolen" },
    out_of_service: { tone: "danger", ar: "خارج الخدمة", en: "Out of Service" },
  },
};

export function statusInfo(kind: string, value: string): StatusInfo {
  return STATUS[kind]?.[value] ?? { tone: "neutral", ar: value, en: value };
}

export function statusLabel(kind: string, value: string, locale: Locale): string {
  const info = statusInfo(kind, value);
  return locale === "ar" ? info.ar : info.en;
}

export function statusOptions(kind: string, locale: Locale): { value: string; label: string }[] {
  return Object.entries(STATUS[kind] ?? {}).map(([value, info]) => ({
    value,
    label: locale === "ar" ? info.ar : info.en,
  }));
}
