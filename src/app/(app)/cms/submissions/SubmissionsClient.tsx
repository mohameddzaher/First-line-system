"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Trash2, Mail } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useI18n } from "@/i18n/provider";
import { formatDateTime } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface SubmissionRow {
  _id: string;
  type: string;
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  status: string;
  createdAt: string;
}

const TYPE = [
  ["contact", "تواصل", "Contact", "info"],
  ["newsletter", "نشرة بريدية", "Newsletter", "accent"],
  ["job_application", "طلب توظيف", "Job Application", "success"],
] as const;
const STATUS = [
  ["new", "جديد", "New", "warning"],
  ["read", "مقروء", "Read", "neutral"],
  ["replied", "تم الرد", "Replied", "success"],
  ["archived", "مؤرشف", "Archived", "neutral"],
] as const;

export function SubmissionsClient({ initial, locale, title }: { initial: ListResult<SubmissionRow>; locale: Locale; title: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [detail, setDetail] = useState<SubmissionRow | null>(null);

  const meta = (arr: readonly (readonly [string, string, string, string])[], v: string) => arr.find((x) => x[0] === v);

  const open = async (row: SubmissionRow) => {
    setDetail(row);
    if (row.status === "new") {
      await fetch(`/api/cms/submissions/${row._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "read" }) });
      router.refresh();
    }
  };

  const setStatus = async (row: SubmissionRow, status: string) => {
    const res = await fetch(`/api/cms/submissions/${row._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (res.ok) { toast.success(t("common.updatedOk")); setDetail(null); router.refresh(); }
  };

  const remove = async (row: SubmissionRow) => {
    const ok = await confirm({ title: t("common.deleteConfirmTitle"), body: row.email ?? row.name, tone: "danger", confirmLabel: t("common.delete") });
    if (!ok) return;
    const res = await fetch(`/api/cms/submissions/${row._id}`, { method: "DELETE" });
    if (res.ok) { toast.success(t("common.deletedOk")); router.refresh(); }
  };

  const columns: Column<SubmissionRow>[] = [
    { key: "createdAt", header: t("common.date"), sortable: true, cell: (r) => <span className="tabular text-sm text-fg-muted">{formatDateTime(r.createdAt)}</span> },
    { key: "type", header: t("common.type"), cell: (r) => { const m = meta(TYPE, r.type); return <Badge tone={(m?.[3] as never) ?? "neutral"}>{m ? (locale === "ar" ? m[1] : m[2]) : r.type}</Badge>; } },
    { key: "name", header: t("common.name"), cell: (r) => <div><p className="text-sm font-medium text-fg">{r.name || "—"}</p>{r.email && <p className="text-xs text-fg-muted" dir="ltr">{r.email}</p>}</div> },
    { key: "subject", header: locale === "ar" ? "الموضوع" : "Subject", hideOnMobile: true, cell: (r) => <span className="text-sm text-fg">{r.subject || "—"}</span> },
    { key: "status", header: t("common.status"), align: "center", cell: (r) => { const m = meta(STATUS, r.status); return <Badge tone={(m?.[3] as never) ?? "neutral"} dot>{m ? (locale === "ar" ? m[1] : m[2]) : r.status}</Badge>; } },
    {
      key: "__actions", header: t("common.actions"), align: "end",
      cell: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => open(r)} aria-label={t("common.view")}><Eye className="size-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => remove(r)} aria-label={t("common.delete")} className="text-danger hover:bg-danger-soft"><Trash2 className="size-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={title} description={`${initial.total} ${t("common.results")}`} />
      <DataTable
        rows={initial.rows}
        columns={columns}
        total={initial.total}
        page={initial.page}
        limit={initial.limit}
        pages={initial.pages}
        rowKey={(r) => r._id}
        onRowClick={open}
        filters={[
          { key: "type", label: t("common.type"), options: TYPE.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
          { key: "status", label: t("common.status"), options: STATUS.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
        ]}
        dateField={{ key: "createdAt", label: t("common.date") }}
        exportConfig={{ endpoint: "/api/cms/submissions/export", filename: "submissions" }}
      />

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.subject || (locale === "ar" ? "رسالة" : "Message")}
        size="lg"
        footer={detail ? (
          <>
            {detail.email && <a href={`mailto:${detail.email}`} className="me-auto"><Button variant="secondary" icon={<Mail className="size-4" />}>{locale === "ar" ? "رد بالبريد" : "Reply"}</Button></a>}
            <Button variant="secondary" onClick={() => setStatus(detail, "archived")}>{locale === "ar" ? "أرشفة" : "Archive"}</Button>
            <Button onClick={() => setStatus(detail, "replied")}>{locale === "ar" ? "وضع كمُجاب" : "Mark replied"}</Button>
          </>
        ) : undefined}
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("common.name")} value={detail.name || "—"} />
              <Field label={t("common.email")} value={detail.email || "—"} />
              <Field label={t("common.phone")} value={detail.phone || "—"} />
              <Field label={t("common.date")} value={formatDateTime(detail.createdAt)} />
            </div>
            {detail.message && (
              <div>
                <p className="mb-1 text-xs text-fg-subtle">{locale === "ar" ? "الرسالة" : "Message"}</p>
                <p className="rounded-lg bg-bg-subtle p-4 text-sm leading-relaxed text-fg">{detail.message}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-fg-subtle">{label}</p><p className="mt-0.5 text-sm text-fg" dir="auto">{value}</p></div>;
}
