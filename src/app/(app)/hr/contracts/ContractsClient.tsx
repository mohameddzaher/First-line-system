"use client";

import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import { statusInfo, statusOptions } from "@/lib/statusMeta";
import { formatDate } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";
import type { ContractRow } from "./page";

const TYPES = [
  ["fixed", "محدد المدة", "Fixed"],
  ["unlimited", "غير محدد المدة", "Unlimited"],
  ["part_time", "دوام جزئي", "Part Time"],
  ["temporary", "مؤقت", "Temporary"],
] as const;

export function ContractsClient({
  initial,
  locale,
  title,
  employees,
}: {
  initial: ListResult<ContractRow>;
  locale: Locale;
  title: string;
  employees: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  const typeLabel = (v: string) => {
    const f = TYPES.find((x) => x[0] === v);
    return f ? (locale === "ar" ? f[1] : f[2]) : v;
  };

  const columns: Column<ContractRow>[] = [
    { key: "employee", header: locale === "ar" ? "الموظف" : "Employee", cell: (r) => <span className="font-medium text-fg">{r.employee?.nameAr ?? "—"}</span> },
    { key: "type", header: t("common.type"), cell: (r) => <span className="text-sm text-fg-muted">{typeLabel(r.type)}</span> },
    { key: "startDate", header: locale === "ar" ? "البداية" : "Start", sortable: true, cell: (r) => <span className="tabular text-sm">{formatDate(r.startDate)}</span> },
    { key: "endDate", header: locale === "ar" ? "النهاية" : "End", sortable: true, cell: (r) => <span className="tabular text-sm">{r.endDate ? formatDate(r.endDate) : "—"}</span> },
    { key: "annualLeaveDays", header: locale === "ar" ? "الإجازة السنوية" : "Annual Leave", align: "center", hideOnMobile: true, cell: (r) => <span className="tabular text-sm">{r.annualLeaveDays} {locale === "ar" ? "يوم" : "d"}</span> },
    { key: "status", header: t("common.status"), align: "center", cell: (r) => { const i = statusInfo("contract", r.status); return <Badge tone={i.tone} dot>{locale === "ar" ? i.ar : i.en}</Badge>; } },
  ];

  const fields: FieldDef[] = [
    { key: "employee", label: locale === "ar" ? "الموظف" : "Employee", type: "select", required: true, options: employees, span: 2 },
    { key: "type", label: t("common.type"), type: "select", options: TYPES.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
    { key: "status", label: t("common.status"), type: "select", options: statusOptions("contract", locale) },
    { key: "startDate", label: locale === "ar" ? "تاريخ البداية" : "Start Date", type: "date", required: true },
    { key: "endDate", label: locale === "ar" ? "تاريخ النهاية" : "End Date", type: "date" },
    { key: "annualLeaveDays", label: locale === "ar" ? "أيام الإجازة السنوية" : "Annual Leave Days", type: "number", dir: "ltr" },
    { key: "basicSalary", label: locale === "ar" ? "الراتب الأساسي" : "Basic Salary", type: "number", dir: "ltr" },
    { key: "notes", label: t("common.notes"), type: "textarea", span: 2 },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/hr/contracts"
      exportFilename="contracts"
      addLabel={locale === "ar" ? "عقد جديد" : "New Contract"}
      labelOf={(r) => r.employee?.nameAr ?? typeLabel(r.type)}
      filters={[
        { key: "status", label: t("common.status"), options: statusOptions("contract", locale) },
        { key: "type", label: t("common.type"), options: TYPES.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
      ]}
      dateField={{ key: "endDate", label: locale === "ar" ? "تاريخ النهاية" : "End Date" }}
    />
  );
}
