"use client";

import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface AccidentRow {
  _id: string;
  date: string;
  description?: string;
  severity: string;
  atFault: string;
  status: string;
  estimatedCost?: number;
  vehicle?: { plateNumber: string } | null;
  employee?: { nameAr: string } | null;
}

const SEVERITY = [
  ["minor", "بسيط", "Minor", "info"],
  ["moderate", "متوسط", "Moderate", "warning"],
  ["major", "كبير", "Major", "danger"],
  ["total_loss", "خسارة كلية", "Total Loss", "danger"],
] as const;
const FAULT = [
  ["driver", "السائق", "Driver"],
  ["third_party", "طرف ثالث", "Third Party"],
  ["shared", "مشترك", "Shared"],
  ["undetermined", "غير محدد", "Undetermined"],
] as const;
const STATUS = [
  ["open", "مفتوح", "Open"],
  ["under_review", "قيد المراجعة", "Under Review"],
  ["closed", "مغلق", "Closed"],
] as const;

export function AccidentsClient({
  initial,
  locale,
  title,
  vehicles,
  employees,
}: {
  initial: ListResult<AccidentRow>;
  locale: Locale;
  title: string;
  vehicles: { value: string; label: string }[];
  employees: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  const sevInfo = (v: string) => SEVERITY.find((x) => x[0] === v);
  const label = (arr: readonly (readonly [string, string, string, ...string[]])[], v: string) => {
    const f = arr.find((x) => x[0] === v);
    return f ? (locale === "ar" ? f[1] : f[2]) : v;
  };

  const columns: Column<AccidentRow>[] = [
    { key: "date", header: t("common.date"), sortable: true, cell: (r) => <span className="tabular text-sm">{formatDate(r.date)}</span> },
    { key: "vehicle", header: locale === "ar" ? "رقم اللوحة" : "Plate", cell: (r) => <span className="font-mono text-sm" dir="ltr">{r.vehicle?.plateNumber ?? "—"}</span> },
    { key: "employee", header: locale === "ar" ? "الموظف" : "Employee", hideOnMobile: true, cell: (r) => <span className="text-sm text-fg">{r.employee?.nameAr ?? "—"}</span> },
    { key: "severity", header: locale === "ar" ? "الجسامة" : "Severity", align: "center", cell: (r) => { const s = sevInfo(r.severity); return <Badge tone={(s?.[3] as never) ?? "neutral"}>{s ? (locale === "ar" ? s[1] : s[2]) : r.severity}</Badge>; } },
    { key: "atFault", header: locale === "ar" ? "الخطأ" : "At Fault", hideOnMobile: true, cell: (r) => <span className="text-sm text-fg-muted">{label(FAULT, r.atFault)}</span> },
    { key: "estimatedCost", header: locale === "ar" ? "التكلفة" : "Cost", align: "end", hideOnMobile: true, cell: (r) => <span className="tabular text-sm">{formatCurrency(r.estimatedCost ?? 0, locale)}</span> },
    { key: "status", header: t("common.status"), align: "center", cell: (r) => <Badge tone={r.status === "closed" ? "neutral" : "warning"} dot>{label(STATUS, r.status)}</Badge> },
  ];

  const fields: FieldDef[] = [
    { key: "vehicle", label: locale === "ar" ? "المركبة" : "Vehicle", type: "select", required: true, options: vehicles, span: 2 },
    { key: "employee", label: locale === "ar" ? "السائق" : "Driver", type: "select", options: employees, span: 2 },
    { key: "date", label: t("common.date"), type: "date", required: true },
    { key: "severity", label: locale === "ar" ? "الجسامة" : "Severity", type: "select", options: SEVERITY.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
    { key: "atFault", label: locale === "ar" ? "الخطأ" : "At Fault", type: "select", options: FAULT.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
    { key: "status", label: t("common.status"), type: "select", options: STATUS.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
    { key: "estimatedCost", label: locale === "ar" ? "التكلفة المقدرة" : "Estimated Cost", type: "number", dir: "ltr" },
    { key: "actualCost", label: locale === "ar" ? "التكلفة الفعلية" : "Actual Cost", type: "number", dir: "ltr" },
    { key: "location", label: locale === "ar" ? "الموقع" : "Location", type: "text" },
    { key: "description", label: locale === "ar" ? "الوصف" : "Description", type: "textarea", span: 2 },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/fleet/accidents"
      exportFilename="accidents"
      addLabel={locale === "ar" ? "تسجيل حادث" : "Report Accident"}
      labelOf={(r) => `${r.vehicle?.plateNumber ?? ""} · ${formatDate(r.date)}`}
      dateField={{ key: "date", label: t("common.date") }}
      filters={[
        { key: "severity", label: locale === "ar" ? "الجسامة" : "Severity", options: SEVERITY.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
        { key: "status", label: t("common.status"), options: STATUS.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
        { key: "atFault", label: locale === "ar" ? "الخطأ" : "At Fault", options: FAULT.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
      ]}
    />
  );
}
