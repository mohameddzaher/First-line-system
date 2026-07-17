"use client";

import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { useI18n } from "@/i18n/provider";
import { formatCurrency } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface TargetRow {
  _id: string;
  period: string;
  targetAmount: number;
  owner?: { firstName: string; lastName: string } | null;
}

export function TargetsClient({
  initial,
  locale,
  title,
  users,
}: {
  initial: ListResult<TargetRow>;
  locale: Locale;
  title: string;
  users: { value: string; label: string }[];
}) {
  const { t } = useI18n();

  const columns: Column<TargetRow>[] = [
    { key: "owner", header: locale === "ar" ? "المسؤول" : "Owner", cell: (r) => <span className="font-medium text-fg">{r.owner ? `${r.owner.firstName} ${r.owner.lastName}` : "—"}</span> },
    { key: "period", header: locale === "ar" ? "الفترة" : "Period", sortable: true, cell: (r) => <span className="font-mono text-sm" dir="ltr">{r.period}</span> },
    { key: "targetAmount", header: locale === "ar" ? "المستهدف" : "Target", align: "end", sortable: true, cell: (r) => <span className="tabular font-medium">{formatCurrency(r.targetAmount, locale)}</span> },
  ];

  const fields: FieldDef[] = [
    { key: "owner", label: locale === "ar" ? "المسؤول" : "Owner", type: "select", required: true, options: users, span: 2 },
    { key: "period", label: locale === "ar" ? "الفترة (مثال 2026-Q3)" : "Period (e.g. 2026-Q3)", type: "text", required: true, dir: "ltr" },
    { key: "targetAmount", label: locale === "ar" ? "المبلغ المستهدف" : "Target Amount", type: "number", required: true, dir: "ltr" },
    { key: "notes", label: t("common.notes"), type: "textarea", span: 2 },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/sales/targets"
      exportFilename="targets"
      addLabel={locale === "ar" ? "إضافة مستهدف" : "Add Target"}
      labelOf={(r) => r.period}
    />
  );
}
