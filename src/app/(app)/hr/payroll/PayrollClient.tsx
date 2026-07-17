"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { StatCard } from "@/components/StatCard";
import { useI18n } from "@/i18n/provider";
import { formatCurrency } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface PayrollRow {
  _id: string;
  nameAr: string;
  employeeNumber?: string;
  basicSalary?: number;
  housingAllowance?: number;
  transportAllowance?: number;
  otherAllowance?: number;
  iban?: string;
  department?: { nameAr: string } | null;
}

export function PayrollClient({
  initial,
  locale,
  title,
  departments,
  totals,
}: {
  initial: ListResult<PayrollRow>;
  locale: Locale;
  title: string;
  departments: { value: string; label: string }[];
  totals: { basic: number; housing: number; transport: number; other: number; grand: number; count: number };
}) {
  const { t } = useI18n();
  const router = useRouter();
  const rowTotal = (r: PayrollRow) => (r.basicSalary ?? 0) + (r.housingAllowance ?? 0) + (r.transportAllowance ?? 0) + (r.otherAllowance ?? 0);

  const columns: Column<PayrollRow>[] = [
    { key: "nameAr", header: t("common.name"), sortable: true, cell: (r) => <div><p className="font-medium text-fg">{r.nameAr}</p>{r.employeeNumber && <p className="text-xs text-fg-muted">#{r.employeeNumber}</p>}</div> },
    { key: "department", header: t("hr.department"), hideOnMobile: true, cell: (r) => <span className="text-sm text-fg-muted">{r.department?.nameAr ?? "—"}</span> },
    { key: "basicSalary", header: locale === "ar" ? "الأساسي" : "Basic", align: "end", sortable: true, cell: (r) => <span className="tabular text-sm">{formatCurrency(r.basicSalary ?? 0, locale)}</span> },
    { key: "housingAllowance", header: locale === "ar" ? "السكن" : "Housing", align: "end", hideOnMobile: true, cell: (r) => <span className="tabular text-sm text-fg-muted">{formatCurrency(r.housingAllowance ?? 0, locale)}</span> },
    { key: "transportAllowance", header: locale === "ar" ? "النقل" : "Transport", align: "end", hideOnMobile: true, cell: (r) => <span className="tabular text-sm text-fg-muted">{formatCurrency(r.transportAllowance ?? 0, locale)}</span> },
    { key: "total", header: locale === "ar" ? "الإجمالي" : "Total", align: "end", cell: (r) => <span className="tabular text-sm font-semibold text-fg">{formatCurrency(rowTotal(r), locale)}</span> },
  ];

  return (
    <>
      <PageHeader title={title} description={`${totals.count} ${locale === "ar" ? "موظف" : "employees"}`} />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label={locale === "ar" ? "الأساسي" : "Basic"} value={formatCurrency(totals.basic, locale)} />
        <StatCard label={locale === "ar" ? "بدل السكن" : "Housing"} value={formatCurrency(totals.housing, locale)} />
        <StatCard label={locale === "ar" ? "بدل النقل" : "Transport"} value={formatCurrency(totals.transport, locale)} />
        <StatCard label={locale === "ar" ? "بدلات أخرى" : "Other"} value={formatCurrency(totals.other, locale)} />
        <StatCard label={locale === "ar" ? "إجمالي الرواتب" : "Total Payroll"} value={formatCurrency(totals.grand, locale)} tone="accent" />
      </div>

      <DataTable
        rows={initial.rows}
        columns={columns}
        total={initial.total}
        page={initial.page}
        limit={initial.limit}
        pages={initial.pages}
        rowKey={(r) => r._id}
        onRowClick={(r) => router.push(`/hr/employees/${r._id}`)}
        filters={[{ key: "department", label: t("hr.department"), options: departments }]}
        exportConfig={{ endpoint: "/api/hr/payroll/export", filename: "payroll" }}
      />
    </>
  );
}
