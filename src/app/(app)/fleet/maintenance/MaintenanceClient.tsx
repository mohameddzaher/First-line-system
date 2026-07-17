"use client";

import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface MaintenanceRow {
  _id: string;
  type: string;
  status: string;
  date: string;
  workshop?: string;
  odometer?: number;
  cost?: number;
  vehicle?: { plateNumber: string; plateLatin?: string } | null;
}

const TYPES = [
  ["periodic", "دورية", "Periodic"],
  ["repair", "إصلاح", "Repair"],
  ["tires", "إطارات", "Tires"],
  ["oil", "زيوت", "Oil"],
  ["accident_repair", "إصلاح حادث", "Accident Repair"],
  ["inspection", "فحص دوري", "Inspection"],
  ["other", "أخرى", "Other"],
] as const;
const STATUS = [
  ["scheduled", "مجدولة", "Scheduled", "info"],
  ["in_progress", "قيد التنفيذ", "In Progress", "warning"],
  ["completed", "مكتملة", "Completed", "success"],
  ["cancelled", "ملغاة", "Cancelled", "neutral"],
] as const;

export function MaintenanceClient({
  initial,
  locale,
  title,
  vehicles,
}: {
  initial: ListResult<MaintenanceRow>;
  locale: Locale;
  title: string;
  vehicles: { value: string; label: string; hint?: string }[];
}) {
  const { t } = useI18n();
  const typeLabel = (v: string) => { const f = TYPES.find((x) => x[0] === v); return f ? (locale === "ar" ? f[1] : f[2]) : v; };
  const statusMeta = (v: string) => STATUS.find((x) => x[0] === v);

  const columns: Column<MaintenanceRow>[] = [
    { key: "date", header: t("common.date"), sortable: true, cell: (r) => <span className="tabular text-sm">{formatDate(r.date)}</span> },
    { key: "vehicle", header: locale === "ar" ? "المركبة" : "Vehicle", cell: (r) => <span className="font-mono text-sm" dir="ltr">{r.vehicle?.plateNumber ?? "—"}</span> },
    { key: "type", header: t("common.type"), cell: (r) => <span className="text-sm text-fg-muted">{typeLabel(r.type)}</span> },
    { key: "workshop", header: locale === "ar" ? "الورشة" : "Workshop", hideOnMobile: true, cell: (r) => <span className="text-sm text-fg">{r.workshop || "—"}</span> },
    { key: "cost", header: locale === "ar" ? "التكلفة" : "Cost", align: "end", sortable: true, cell: (r) => <span className="tabular text-sm">{r.cost ? formatCurrency(r.cost, locale) : "—"}</span> },
    { key: "status", header: t("common.status"), align: "center", cell: (r) => { const m = statusMeta(r.status); return <Badge tone={(m?.[3] as never) ?? "neutral"} dot>{m ? (locale === "ar" ? m[1] : m[2]) : r.status}</Badge>; } },
  ];

  const fields: FieldDef[] = [
    { key: "vehicle", label: locale === "ar" ? "المركبة" : "Vehicle", type: "select", required: true, options: vehicles, span: 2 },
    { key: "type", label: t("common.type"), type: "select", options: TYPES.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
    { key: "status", label: t("common.status"), type: "select", options: STATUS.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
    { key: "date", label: t("common.date"), type: "date", required: true },
    { key: "completedDate", label: locale === "ar" ? "تاريخ الإكمال" : "Completed Date", type: "date" },
    { key: "workshop", label: locale === "ar" ? "الورشة" : "Workshop", type: "text" },
    { key: "odometer", label: locale === "ar" ? "قراءة العداد" : "Odometer", type: "number", dir: "ltr" },
    { key: "cost", label: locale === "ar" ? "التكلفة" : "Cost", type: "number", dir: "ltr" },
    { key: "description", label: locale === "ar" ? "الوصف" : "Description", type: "textarea", span: 2 },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/fleet/maintenance"
      exportFilename="maintenance"
      addLabel={locale === "ar" ? "تسجيل صيانة" : "Log Maintenance"}
      labelOf={(r) => `${r.vehicle?.plateNumber ?? ""} · ${typeLabel(r.type)}`}
      filters={[
        { key: "type", label: t("common.type"), options: TYPES.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
        { key: "status", label: t("common.status"), options: STATUS.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
      ]}
      dateField={{ key: "date", label: t("common.date") }}
    />
  );
}
