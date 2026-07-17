"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ResourceForm, type FieldDef } from "@/components/data/ResourceForm";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useI18n } from "@/i18n/provider";
import { statusInfo, statusOptions } from "@/lib/statusMeta";
import { formatDate } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";
import type { LeaveRow } from "./page";

export function LeavesClient({
  initial,
  locale,
  title,
  employees,
  leaveTypes,
}: {
  initial: ListResult<LeaveRow>;
  locale: Locale;
  title: string;
  employees: { value: string; label: string }[];
  leaveTypes: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [formOpen, setFormOpen] = useState(false);

  const review = async (row: LeaveRow, status: "approved" | "rejected") => {
    const ok = await confirm({
      title: status === "approved" ? (locale === "ar" ? "الموافقة على الإجازة" : "Approve leave") : locale === "ar" ? "رفض الإجازة" : "Reject leave",
      body: `${row.employee?.nameAr ?? ""} · ${row.days} ${locale === "ar" ? "يوم" : "days"}`,
      tone: status === "approved" ? "info" : "warning",
      confirmLabel: status === "approved" ? t("common.confirm") : t("common.confirm"),
    });
    if (!ok) return;
    const res = await fetch(`/api/hr/leaves/${row._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(status === "approved" ? (locale === "ar" ? "تمت الموافقة" : "Approved") : locale === "ar" ? "تم الرفض" : "Rejected");
      router.refresh();
    } else {
      toast.error(t("common.somethingWentWrong"));
    }
  };

  const columns: Column<LeaveRow>[] = [
    { key: "employee", header: locale === "ar" ? "الموظف" : "Employee", cell: (r) => <span className="font-medium text-fg">{r.employee?.nameAr ?? "—"}</span> },
    { key: "leaveType", header: t("common.type"), cell: (r) => <span className="text-sm text-fg-muted">{r.leaveType ? (locale === "ar" ? r.leaveType.nameAr : r.leaveType.nameEn) : "—"}</span> },
    { key: "period", header: locale === "ar" ? "الفترة" : "Period", cell: (r) => <span className="tabular text-sm">{formatDate(r.startDate)} → {formatDate(r.endDate)}</span> },
    { key: "days", header: locale === "ar" ? "الأيام" : "Days", align: "center", sortable: true, cell: (r) => <span className="tabular font-medium">{r.days}</span> },
    { key: "balanceAtRequest", header: locale === "ar" ? "الرصيد" : "Balance", align: "center", hideOnMobile: true, cell: (r) => <span className="tabular text-sm text-fg-muted">{r.balanceAtRequest ?? "—"}</span> },
    { key: "status", header: t("common.status"), align: "center", cell: (r) => { const i = statusInfo("leave", r.status); return <Badge tone={i.tone} dot>{locale === "ar" ? i.ar : i.en}</Badge>; } },
    {
      key: "__review",
      header: t("common.actions"),
      align: "end",
      cell: (r) =>
        r.status === "pending" ? (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" onClick={() => review(r, "approved")} aria-label={locale === "ar" ? "موافقة" : "Approve"} className="text-success hover:bg-success-soft">
              <Check className="size-4" aria-hidden />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => review(r, "rejected")} aria-label={locale === "ar" ? "رفض" : "Reject"} className="text-danger hover:bg-danger-soft">
              <X className="size-4" aria-hidden />
            </Button>
          </div>
        ) : (
          <span className="text-xs text-fg-subtle">—</span>
        ),
    },
  ];

  const fields: FieldDef[] = [
    { key: "employee", label: locale === "ar" ? "الموظف" : "Employee", type: "select", required: true, options: employees, span: 2 },
    { key: "leaveType", label: t("common.type"), type: "select", required: true, options: leaveTypes, span: 2 },
    { key: "startDate", label: locale === "ar" ? "من تاريخ" : "Start Date", type: "date", required: true },
    { key: "endDate", label: locale === "ar" ? "إلى تاريخ" : "End Date", type: "date", required: true },
    { key: "reason", label: locale === "ar" ? "السبب" : "Reason", type: "textarea", span: 2 },
  ];

  const pending = initial.rows.filter((r) => r.status === "pending").length;

  return (
    <>
      <PageHeader
        title={title}
        description={`${pending} ${locale === "ar" ? "قيد الموافقة" : "pending"}`}
        action={
          <Button onClick={() => setFormOpen(true)} icon={<Plus className="size-4" />}>
            {locale === "ar" ? "طلب إجازة" : "New Leave"}
          </Button>
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
        filters={[{ key: "status", label: t("common.status"), options: statusOptions("leave", locale) }]}
        dateField={{ key: "startDate", label: locale === "ar" ? "تاريخ البداية" : "Start Date" }}
        exportConfig={{ endpoint: "/api/hr/leaves/export", filename: "leaves" }}
      />

      <ResourceForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        fields={fields}
        endpoint="/api/hr/leaves"
        editing={null}
        titleCreate={locale === "ar" ? "طلب إجازة" : "New Leave Request"}
        titleEdit=""
        onSaved={() => {
          setFormOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
