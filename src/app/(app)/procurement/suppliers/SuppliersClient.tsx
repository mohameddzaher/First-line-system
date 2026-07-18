"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/data/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import { formatCurrency } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";
import type { SupplierRow } from "./page";

export function SuppliersClient({
  initial,
  locale,
  title,
  stats,
}: {
  initial: ListResult<SupplierRow>;
  locale: Locale;
  title: string;
  stats: Record<string, { orders: number; open: number; spend: number }>;
}) {
  const { t } = useI18n();
  const ar = locale === "ar";

  const columns: Column<SupplierRow>[] = [
    {
      key: "name",
      header: t("common.name"),
      sortable: true,
      cell: (r) => (
        <Link href={`/crm/companies/${r._id}`} className="font-medium text-primary hover:underline">
          {ar ? (r.nameAr ?? r.name) : r.name}
        </Link>
      ),
    },
    {
      key: "contact",
      header: ar ? "التواصل" : "Contact",
      cell: (r) => (
        <div className="text-xs text-fg-muted" dir="ltr">
          {r.phone ? <p>{r.phone}</p> : null}
          {r.email ? <p>{r.email}</p> : null}
          {!r.phone && !r.email ? "—" : null}
        </div>
      ),
    },
    { key: "city", header: ar ? "المدينة" : "City", cell: (r) => r.city || "—" },
    {
      key: "orders",
      header: ar ? "أوامر الشراء" : "POs",
      align: "center",
      cell: (r) => (
        <Link
          href={`/procurement/orders?f_supplier=${r._id}`}
          className="font-medium text-primary hover:underline"
        >
          {stats[r._id]?.orders ?? 0}
        </Link>
      ),
    },
    {
      key: "open",
      header: ar ? "مفتوحة" : "Open",
      align: "center",
      cell: (r) => {
        const open = stats[r._id]?.open ?? 0;
        return open > 0 ? <Badge tone="warning">{open}</Badge> : <span className="text-fg-subtle">0</span>;
      },
    },
    {
      key: "spend",
      header: ar ? "إجمالي المشتريات" : "Total spend",
      align: "end",
      cell: (r) => (
        <span className="font-medium tabular">{formatCurrency(stats[r._id]?.spend ?? 0, locale)}</span>
      ),
    },
    {
      key: "status",
      header: t("common.status"),
      align: "center",
      cell: (r) => (
        <Badge tone={r.status === "active" ? "success" : "neutral"} dot>
          {r.status}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={title}
        description={
          ar
            ? "الموردون هم شركات علاقات العملاء المصنّفة كمورّد. تُدار بياناتهم من قسم علاقات العملاء."
            : "Suppliers are CRM companies flagged as vendors. Their records are maintained in CRM."
        }
      />
      <DataTable
        rows={initial.rows}
        columns={columns}
        total={initial.total}
        page={initial.page}
        limit={initial.limit}
        pages={initial.pages}
        rowKey={(r) => r._id}
        searchPlaceholder={ar ? "ابحث عن مورّد…" : "Search suppliers…"}
        filters={[
          {
            key: "status",
            label: t("common.status"),
            options: [
              { value: "active", label: ar ? "نشط" : "Active" },
              { value: "prospect", label: ar ? "مُحتمل" : "Prospect" },
              { value: "inactive", label: ar ? "غير نشط" : "Inactive" },
            ],
          },
        ]}
        exportConfig={{ endpoint: "/api/crm/companies/export?f_kind=vendor", filename: "suppliers" }}
      />
    </>
  );
}
