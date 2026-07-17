"use client";

import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import { statusInfo, statusOptions } from "@/lib/statusMeta";
import { formatDateTime } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";
import type { RequestRow } from "./page";

const CATEGORIES = [
  ["salary_certificate", "شهادة راتب", "Salary Certificate"],
  ["salary_definition", "تعريف بالراتب", "Salary Definition"],
  ["experience_certificate", "شهادة خبرة", "Experience Certificate"],
  ["leave_balance", "رصيد الإجازات", "Leave Balance"],
  ["advance", "سلفة", "Advance"],
  ["loan", "قرض", "Loan"],
  ["transfer", "نقل", "Transfer"],
  ["resignation", "استقالة", "Resignation"],
  ["complaint", "شكوى", "Complaint"],
  ["other", "أخرى", "Other"],
] as const;

export function RequestsClient({
  initial,
  locale,
  title,
  employees,
}: {
  initial: ListResult<RequestRow>;
  locale: Locale;
  title: string;
  employees: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  const catLabel = (v: string) => {
    const f = CATEGORIES.find((x) => x[0] === v);
    return f ? (locale === "ar" ? f[1] : f[2]) : v;
  };

  const columns: Column<RequestRow>[] = [
    { key: "employee", header: locale === "ar" ? "الموظف" : "Employee", cell: (r) => <span className="font-medium text-fg">{r.employee?.nameAr ?? "—"}</span> },
    { key: "category", header: locale === "ar" ? "الفئة" : "Category", cell: (r) => <span className="text-sm text-fg-muted">{catLabel(r.category)}</span> },
    { key: "subject", header: locale === "ar" ? "الموضوع" : "Subject", cell: (r) => <span className="text-sm text-fg">{r.subject}</span> },
    { key: "status", header: t("common.status"), align: "center", cell: (r) => { const i = statusInfo("request", r.status); return <Badge tone={i.tone} dot>{locale === "ar" ? i.ar : i.en}</Badge>; } },
    { key: "updatedAt", header: locale === "ar" ? "آخر تحديث" : "Updated", hideOnMobile: true, cell: (r) => <span className="tabular text-xs text-fg-muted">{formatDateTime(r.updatedAt)}</span> },
  ];

  const fields: FieldDef[] = [
    { key: "employee", label: locale === "ar" ? "الموظف" : "Employee", type: "select", required: true, options: employees, span: 2 },
    { key: "category", label: locale === "ar" ? "الفئة" : "Category", type: "select", options: CATEGORIES.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
    { key: "status", label: t("common.status"), type: "select", options: statusOptions("request", locale) },
    { key: "subject", label: locale === "ar" ? "الموضوع" : "Subject", type: "text", required: true, span: 2 },
    { key: "body", label: locale === "ar" ? "التفاصيل" : "Details", type: "textarea", span: 2 },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/hr/requests"
      exportFilename="requests"
      addLabel={locale === "ar" ? "طلب جديد" : "New Request"}
      labelOf={(r) => r.subject}
      filters={[
        { key: "status", label: t("common.status"), options: statusOptions("request", locale) },
        { key: "category", label: locale === "ar" ? "الفئة" : "Category", options: CATEGORIES.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
      ]}
      dateField={{ key: "createdAt", label: t("common.date") }}
    />
  );
}
