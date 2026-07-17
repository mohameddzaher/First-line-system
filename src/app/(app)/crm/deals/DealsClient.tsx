"use client";

import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface DealRow {
  _id: string;
  title: string;
  stage: string;
  value: number;
  probability: number;
  expectedCloseDate?: string;
  company?: { name: string } | null;
  owner?: { firstName: string; lastName: string } | null;
}

const STAGES = [
  ["lead", "عميل محتمل", "Lead", "neutral"],
  ["qualified", "مؤهّل", "Qualified", "info"],
  ["proposal", "عرض سعر", "Proposal", "info"],
  ["negotiation", "تفاوض", "Negotiation", "warning"],
  ["won", "مكسوبة", "Won", "success"],
  ["lost", "خاسرة", "Lost", "danger"],
] as const;

export function DealsClient({
  initial,
  locale,
  title,
  companies,
  users,
}: {
  initial: ListResult<DealRow>;
  locale: Locale;
  title: string;
  companies: { value: string; label: string }[];
  users: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  const stageMeta = (v: string) => STAGES.find((x) => x[0] === v);

  const columns: Column<DealRow>[] = [
    { key: "title", header: locale === "ar" ? "العنوان" : "Title", sortable: true, cell: (r) => <span className="font-medium text-fg">{r.title}</span> },
    { key: "company", header: locale === "ar" ? "الشركة" : "Company", cell: (r) => <span className="text-sm text-fg-muted">{r.company?.name || "—"}</span> },
    { key: "stage", header: locale === "ar" ? "المرحلة" : "Stage", cell: (r) => { const m = stageMeta(r.stage); return <Badge tone={(m?.[3] as never) ?? "neutral"} dot>{m ? (locale === "ar" ? m[1] : m[2]) : r.stage}</Badge>; } },
    { key: "value", header: locale === "ar" ? "القيمة" : "Value", align: "end", sortable: true, cell: (r) => <span className="tabular text-sm font-medium">{formatCurrency(r.value, locale)}</span> },
    { key: "probability", header: locale === "ar" ? "الاحتمالية" : "Prob.", align: "center", hideOnMobile: true, cell: (r) => <span className="tabular text-sm text-fg-muted">{r.probability}%</span> },
    { key: "owner", header: locale === "ar" ? "المسؤول" : "Owner", hideOnMobile: true, cell: (r) => <span className="text-sm text-fg-muted">{r.owner ? `${r.owner.firstName} ${r.owner.lastName}` : "—"}</span> },
    { key: "expectedCloseDate", header: locale === "ar" ? "الإغلاق المتوقع" : "Close", hideOnMobile: true, cell: (r) => <span className="tabular text-sm">{r.expectedCloseDate ? formatDate(r.expectedCloseDate) : "—"}</span> },
  ];

  const fields: FieldDef[] = [
    { key: "title", label: locale === "ar" ? "العنوان" : "Title", type: "text", required: true, span: 2 },
    { key: "company", label: locale === "ar" ? "الشركة" : "Company", type: "select", options: companies },
    { key: "owner", label: locale === "ar" ? "المسؤول" : "Owner", type: "select", options: users },
    { key: "stage", label: locale === "ar" ? "المرحلة" : "Stage", type: "select", options: STAGES.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
    { key: "value", label: locale === "ar" ? "القيمة" : "Value", type: "number", dir: "ltr" },
    { key: "probability", label: locale === "ar" ? "الاحتمالية %" : "Probability %", type: "number", dir: "ltr" },
    { key: "expectedCloseDate", label: locale === "ar" ? "تاريخ الإغلاق المتوقع" : "Expected Close Date", type: "date" },
    { key: "notes", label: t("common.notes"), type: "textarea", span: 2 },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/crm/deals"
      exportFilename="deals"
      addLabel={locale === "ar" ? "إضافة صفقة" : "Add Deal"}
      labelOf={(r) => r.title}
      filters={[{ key: "stage", label: locale === "ar" ? "المرحلة" : "Stage", options: STAGES.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) }]}
      dateField={{ key: "expectedCloseDate", label: locale === "ar" ? "تاريخ الإغلاق" : "Close Date" }}
    />
  );
}
