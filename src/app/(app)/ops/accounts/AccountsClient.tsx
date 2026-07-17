"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, UserPlus, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Select, Input, Textarea } from "@/components/ui/Field";
import { Combobox } from "@/components/ui/Combobox";
import { ResourceForm, type FieldDef } from "@/components/data/ResourceForm";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useI18n } from "@/i18n/provider";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

interface Assignment {
  _id: string;
  employee?: { _id: string; nameAr: string } | null;
  shift: string;
  active: boolean;
}

export interface AccountRow {
  _id: string;
  username: string;
  externalId?: string;
  status: string;
  project?: { _id: string; nameAr: string; nameEn?: string } | null;
  assignments: Assignment[];
}

const SHIFTS = [
  ["full", "كامل", "Full"],
  ["morning", "صباحي", "Morning"],
  ["evening", "مسائي", "Evening"],
  ["night", "ليلي", "Night"],
] as const;
const STATUS = [
  ["active", "نشط", "Active", "success"],
  ["idle", "خامل", "Idle", "neutral"],
  ["suspended", "موقوف", "Suspended", "warning"],
  ["closed", "مغلق", "Closed", "danger"],
] as const;

export function AccountsClient({
  initial,
  locale,
  title,
  projects,
  employees,
}: {
  initial: ListResult<AccountRow>;
  locale: Locale;
  title: string;
  projects: { value: string; label: string }[];
  employees: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AccountRow | null>(null);
  const [assignFor, setAssignFor] = useState<AccountRow | null>(null);
  const [assignForm, setAssignForm] = useState({ employee: "", shift: "full", note: "" });
  const [busy, setBusy] = useState(false);

  const shiftLabel = (v: string) => { const f = SHIFTS.find((x) => x[0] === v); return f ? (locale === "ar" ? f[1] : f[2]) : v; };
  const statusMeta = (v: string) => STATUS.find((x) => x[0] === v);

  const submitAssign = async () => {
    if (!assignForm.employee || !assignFor) { toast.error(t("common.required")); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/ops/accounts/${assignFor._id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignForm),
      });
      if (res.ok) {
        toast.success(locale === "ar" ? "تم تسليم المندوب للحساب" : "Rider assigned");
        setAssignFor(null);
        setAssignForm({ employee: "", shift: "full", note: "" });
        router.refresh();
      } else toast.error(t("common.somethingWentWrong"));
    } finally { setBusy(false); }
  };

  const unassign = async (account: AccountRow, assignmentId: string) => {
    const ok = await confirm({ title: locale === "ar" ? "إنهاء التسليم" : "End assignment", tone: "warning" });
    if (!ok) return;
    const res = await fetch(`/api/ops/accounts/${account._id}/unassign`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignmentId }),
    });
    if (res.ok) { toast.success(t("common.updatedOk")); router.refresh(); } else toast.error(t("common.somethingWentWrong"));
  };

  const remove = async (row: AccountRow) => {
    const ok = await confirm({ title: t("common.deleteConfirmTitle"), body: row.username, tone: "danger", confirmLabel: t("common.delete") });
    if (!ok) return;
    const res = await fetch(`/api/ops/accounts/${row._id}`, { method: "DELETE" });
    if (res.ok) { toast.success(t("common.deletedOk")); router.refresh(); } else toast.error(t("common.somethingWentWrong"));
  };

  const columns: Column<AccountRow>[] = [
    { key: "project", header: locale === "ar" ? "المشروع" : "Project", cell: (r) => <span className="text-sm font-medium text-fg">{r.project?.nameAr ?? "—"}</span> },
    { key: "username", header: locale === "ar" ? "اسم المستخدم" : "Username", sortable: true, cell: (r) => <span className="font-mono text-sm" dir="ltr">{r.username}</span> },
    {
      key: "riders",
      header: locale === "ar" ? "المناديب" : "Riders",
      cell: (r) => {
        const active = r.assignments.filter((a) => a.active);
        if (active.length === 0) return <span className="text-sm text-fg-subtle">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {active.map((a) => (
              <span key={a._id} className="inline-flex items-center gap-1 rounded-md bg-bg-subtle px-2 py-0.5 text-xs">
                <span className="text-fg">{a.employee?.nameAr}</span>
                <span className="text-fg-subtle">· {shiftLabel(a.shift)}</span>
                <button onClick={(e) => { e.stopPropagation(); unassign(r, a._id); }} className="text-fg-subtle hover:text-danger" aria-label={t("common.delete")}>
                  <X className="size-3" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        );
      },
    },
    { key: "status", header: t("common.status"), align: "center", cell: (r) => { const s = statusMeta(r.status); return <Badge tone={(s?.[3] as never) ?? "neutral"} dot>{s ? (locale === "ar" ? s[1] : s[2]) : r.status}</Badge>; } },
    {
      key: "__actions",
      header: t("common.actions"),
      align: "end",
      cell: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => setAssignFor(r)} aria-label={locale === "ar" ? "تسليم مندوب" : "Assign rider"} className="text-primary"><UserPlus className="size-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setFormOpen(true); }} aria-label={t("common.edit")}><Pencil className="size-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => remove(r)} aria-label={t("common.delete")} className="text-danger hover:bg-danger-soft"><Trash2 className="size-4" /></Button>
        </div>
      ),
    },
  ];

  const fields: FieldDef[] = [
    { key: "project", label: locale === "ar" ? "المشروع" : "Project", type: "select", required: true, options: projects, span: 2 },
    { key: "username", label: locale === "ar" ? "اسم المستخدم" : "Username", type: "text", required: true, dir: "ltr" },
    { key: "externalId", label: locale === "ar" ? "المعرّف الخارجي" : "External ID", type: "text", dir: "ltr" },
    { key: "phone", label: t("common.phone"), type: "text", dir: "ltr" },
    { key: "status", label: t("common.status"), type: "select", options: STATUS.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
    { key: "notes", label: t("common.notes"), type: "textarea", span: 2 },
  ];

  return (
    <>
      <PageHeader
        title={title}
        description={`${initial.total} ${t("common.results")}`}
        action={<Button onClick={() => { setEditing(null); setFormOpen(true); }} icon={<Plus className="size-4" />}>{locale === "ar" ? "إضافة حساب" : "Add Account"}</Button>}
      />

      <DataTable
        rows={initial.rows}
        columns={columns}
        total={initial.total}
        page={initial.page}
        limit={initial.limit}
        pages={initial.pages}
        rowKey={(r) => r._id}
        filters={[
          { key: "project", label: locale === "ar" ? "المشروع" : "Project", options: projects },
          { key: "status", label: t("common.status"), options: STATUS.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
        ]}
        exportConfig={{ endpoint: "/api/ops/accounts/export", filename: "accounts" }}
      />

      <ResourceForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        fields={fields}
        endpoint="/api/ops/accounts"
        editing={editing as unknown as Record<string, unknown> | null}
        titleCreate={locale === "ar" ? "إضافة حساب" : "Add Account"}
        titleEdit={locale === "ar" ? "تعديل حساب" : "Edit Account"}
        onSaved={() => { setFormOpen(false); router.refresh(); }}
      />

      <Modal
        open={assignFor !== null}
        onClose={() => !busy && setAssignFor(null)}
        title={locale === "ar" ? "تسليم مندوب للحساب" : "Assign Rider to Account"}
        description={assignFor?.username}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignFor(null)} disabled={busy}>{t("common.cancel")}</Button>
            <Button onClick={submitAssign} loading={busy}>{locale === "ar" ? "تسليم" : "Assign"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Combobox label={locale === "ar" ? "المندوب" : "Rider"} value={assignForm.employee} onChange={(v) => setAssignForm({ ...assignForm, employee: v })} options={employees} placeholder={locale === "ar" ? "اختر المندوب" : "Select rider"} required />
          <Select label={locale === "ar" ? "الوردية" : "Shift"} value={assignForm.shift} onChange={(e) => setAssignForm({ ...assignForm, shift: e.target.value })} options={SHIFTS.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] }))} />
          <Textarea label={t("common.notes")} value={assignForm.note} onChange={(e) => setAssignForm({ ...assignForm, note: e.target.value })} />
          <p className="text-xs text-fg-subtle">
            {locale === "ar"
              ? "إذا كان المندوب مسلَّماً على حساب آخر بنفس الوردية، سيُنقل تلقائياً إلى هذا الحساب."
              : "If the rider is on another account for the same shift, they will be transferred here automatically."}
          </p>
        </div>
      </Modal>
    </>
  );
}
