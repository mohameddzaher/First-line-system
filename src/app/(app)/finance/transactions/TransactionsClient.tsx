"use client";

import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface TxnRow {
  _id: string;
  reference: string;
  kind: string;
  category: string;
  amount: number;
  date: string;
  status: string;
  project?: { nameAr: string } | null;
}

export function TransactionsClient({
  initial,
  locale,
  title,
  projects,
}: {
  initial: ListResult<TxnRow>;
  locale: Locale;
  title: string;
  projects: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  const ar = locale === "ar";

  const columns: Column<TxnRow>[] = [
    { key: "reference", header: ar ? "المرجع" : "Reference", sortable: true, cell: (r) => <span className="font-mono text-sm" dir="ltr">{r.reference}</span> },
    { key: "kind", header: ar ? "النوع" : "Kind", cell: (r) => <Badge tone={r.kind === "revenue" ? "success" : "danger"}>{r.kind === "revenue" ? (ar ? "إيراد" : "Revenue") : ar ? "مصروف" : "Expense"}</Badge> },
    { key: "category", header: ar ? "الفئة" : "Category", cell: (r) => <span className="text-sm text-fg-muted">{r.category}</span> },
    { key: "project", header: ar ? "المشروع" : "Project", hideOnMobile: true, cell: (r) => <span className="text-sm text-fg-muted">{r.project?.nameAr ?? "—"}</span> },
    { key: "date", header: t("common.date"), sortable: true, hideOnMobile: true, cell: (r) => <span className="tabular text-sm">{formatDate(r.date)}</span> },
    { key: "amount", header: ar ? "المبلغ" : "Amount", align: "end", sortable: true, cell: (r) => <span className={`tabular text-sm font-semibold ${r.kind === "revenue" ? "text-success" : "text-danger"}`}>{r.kind === "revenue" ? "+" : "−"}{formatCurrency(r.amount, locale)}</span> },
  ];

  const fields: FieldDef[] = [
    { key: "reference", label: ar ? "المرجع" : "Reference", type: "text", required: true, dir: "ltr" },
    { key: "kind", label: ar ? "النوع" : "Kind", type: "select", options: [{ value: "revenue", label: ar ? "إيراد" : "Revenue" }, { value: "expense", label: ar ? "مصروف" : "Expense" }] },
    { key: "category", label: ar ? "الفئة" : "Category", type: "text", required: true },
    { key: "amount", label: ar ? "المبلغ" : "Amount", type: "number", required: true, dir: "ltr" },
    { key: "date", label: t("common.date"), type: "date", required: true },
    { key: "status", label: t("common.status"), type: "select", options: [
      { value: "posted", label: ar ? "مُرحّل" : "Posted" }, { value: "draft", label: ar ? "مسودة" : "Draft" },
      { value: "reconciled", label: ar ? "مُطابق" : "Reconciled" }, { value: "void", label: ar ? "ملغى" : "Void" },
    ] },
    { key: "project", label: ar ? "المشروع" : "Project", type: "select", options: projects },
    { key: "method", label: ar ? "طريقة الدفع" : "Payment Method", type: "text" },
    { key: "description", label: ar ? "الوصف" : "Description", type: "textarea", span: 2 },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/finance/transactions"
      exportFilename="transactions"
      addLabel={ar ? "حركة جديدة" : "New Transaction"}
      labelOf={(r) => r.reference}
      filters={[
        { key: "kind", label: ar ? "النوع" : "Kind", options: [{ value: "revenue", label: ar ? "إيراد" : "Revenue" }, { value: "expense", label: ar ? "مصروف" : "Expense" }] },
        { key: "project", label: ar ? "المشروع" : "Project", options: projects },
      ]}
      dateField={{ key: "date", label: t("common.date") }}
    />
  );
}
