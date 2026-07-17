"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserMinus, History, Users, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select, Textarea } from "@/components/ui/Field";
import { Combobox } from "@/components/ui/Combobox";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useI18n } from "@/i18n/provider";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Locale } from "@/i18n/dictionaries";

type EmpRef = { _id?: string; nameAr: string; employeeNumber?: string } | null;

interface Account {
  _id: string;
  username: string;
  externalId?: string;
  phone?: string;
  status: string;
  project?: { nameAr: string } | null;
  assignments: { _id: string; employee?: EmpRef; shift: string; startDate: string; endDate?: string | null; active: boolean }[];
  history: { action: string; employee?: EmpRef; shift?: string; date: string; note?: string }[];
}

const SHIFT: Record<string, [string, string]> = { full: ["كامل", "Full"], morning: ["صباحي", "Morning"], evening: ["مسائي", "Evening"], night: ["ليلي", "Night"] };
const ACTION: Record<string, [string, string, string]> = {
  assigned: ["تم التسليم", "Assigned", "success"],
  transferred_in: ["نُقل إليه", "Transferred in", "info"],
  transferred_out: ["نُقل منه", "Transferred out", "warning"],
  removed: ["أُنهي", "Removed", "neutral"],
};
const STATUS: Record<string, [string, string, string]> = {
  active: ["نشط", "Active", "success"], idle: ["خامل", "Idle", "info"], suspended: ["موقوف", "Suspended", "warning"], closed: ["مغلق", "Closed", "danger"],
};

export function AccountDetail({
  locale,
  account,
  audit,
  employees,
}: {
  locale: Locale;
  account: Account;
  audit: Record<string, unknown>[];
  employees: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const ar = locale === "ar";
  const [assignOpen, setAssignOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ employee: "", shift: "full", note: "" });

  const active = account.assignments.filter((a) => a.active);
  const shiftLabel = (v: string) => SHIFT[v]?.[ar ? 0 : 1] ?? v;
  const st = STATUS[account.status];

  const assign = async () => {
    if (!form.employee) { toast.error(t("common.required")); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/ops/accounts/${account._id}/assign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { toast.success(ar ? "تم تسليم المندوب" : "Rider assigned"); setAssignOpen(false); setForm({ employee: "", shift: "full", note: "" }); router.refresh(); }
      else toast.error(t("common.somethingWentWrong"));
    } finally { setBusy(false); }
  };

  const unassign = async (assignmentId: string) => {
    const ok = await confirm({ title: ar ? "إنهاء التسليم" : "End assignment", tone: "warning" });
    if (!ok) return;
    const res = await fetch(`/api/ops/accounts/${account._id}/unassign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignmentId }) });
    if (res.ok) { toast.success(t("common.updatedOk")); router.refresh(); } else toast.error(t("common.somethingWentWrong"));
  };

  return (
    <>
      <PageHeader title="" backHref="/ops/accounts" backLabel={t("common.back")} />

      <Card className="mb-5">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-2xl font-bold text-fg" dir="ltr">{account.username}</h1>
              {st && <Badge tone={st[2] as never} dot>{ar ? st[0] : st[1]}</Badge>}
            </div>
            <p className="mt-1 text-sm text-fg-muted">
              {[account.project?.nameAr, account.externalId, account.phone].filter(Boolean).join(" · ")}
            </p>
          </div>
          <Button onClick={() => setAssignOpen(true)} icon={<UserPlus className="size-4" />}>{ar ? "تسليم مندوب" : "Assign Rider"}</Button>
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Active riders */}
        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><Users className="size-4 text-primary" />{ar ? "المناديب النشطون" : "Active Riders"}</span>} />
          {active.length === 0 ? (
            <EmptyState title={ar ? "لا يوجد مناديب مسلَّمون" : "No active riders"} />
          ) : (
            <div className="divide-y divide-border">
              {active.map((a) => (
                <div key={a._id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-fg">{a.employee?.nameAr ?? "—"}</p>
                    <p className="text-xs text-fg-muted">{shiftLabel(a.shift)} · {ar ? "منذ" : "since"} {formatDate(a.startDate)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => unassign(a._id)} className="text-danger hover:bg-danger-soft" aria-label={ar ? "إنهاء" : "End"}><UserMinus className="size-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Assignment history */}
        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><History className="size-4 text-primary" />{ar ? "سجل التسليمات" : "Assignment History"}</span>} />
          <CardBody>
            {account.history.length === 0 ? (
              <p className="text-sm text-fg-subtle">{t("common.noData")}</p>
            ) : (
              <ol className="relative space-y-4 border-s border-border ps-6">
                {[...account.history].reverse().map((h, i) => {
                  const a = ACTION[h.action];
                  return (
                    <li key={i} className="relative">
                      <span className="absolute -start-[27px] top-1 size-3 rounded-full bg-primary ring-4 ring-surface" aria-hidden />
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={(a?.[2] as never) ?? "neutral"}>{a ? (ar ? a[0] : a[1]) : h.action}</Badge>
                        <span className="text-sm text-fg">{h.employee?.nameAr ?? "—"}</span>
                        {h.shift && <span className="text-xs text-fg-subtle">{shiftLabel(h.shift)}</span>}
                        <span className="text-xs text-fg-subtle tabular">{formatDateTime(h.date)}</span>
                      </div>
                      {h.note && <p className="mt-1 text-xs text-fg-muted">{h.note}</p>}
                    </li>
                  );
                })}
              </ol>
            )}
          </CardBody>
        </Card>
      </div>

      {/* All assignments table (incl. ended) */}
      <Card className="mt-5 overflow-hidden">
        <CardHeader title={ar ? "كل التسليمات" : "All Assignments"} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-subtle text-xs text-fg-muted">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{ar ? "المندوب" : "Rider"}</th>
                <th className="px-4 py-3 text-start font-medium">{ar ? "الوردية" : "Shift"}</th>
                <th className="px-4 py-3 text-start font-medium">{ar ? "من" : "From"}</th>
                <th className="px-4 py-3 text-start font-medium">{ar ? "إلى" : "To"}</th>
                <th className="px-4 py-3 text-center font-medium">{t("common.status")}</th>
              </tr>
            </thead>
            <tbody>
              {account.assignments.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-fg-subtle">{t("common.noData")}</td></tr>
              )}
              {[...account.assignments].reverse().map((a) => (
                <tr key={a._id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-fg">{a.employee?.nameAr ?? "—"}</td>
                  <td className="px-4 py-3 text-fg-muted">{shiftLabel(a.shift)}</td>
                  <td className="px-4 py-3 tabular">{formatDate(a.startDate)}</td>
                  <td className="px-4 py-3 tabular">{a.endDate ? formatDate(a.endDate) : "—"}</td>
                  <td className="px-4 py-3 text-center">{a.active ? <Badge tone="success" dot>{ar ? "نشط" : "Active"}</Badge> : <Badge tone="neutral">{ar ? "منتهٍ" : "Ended"}</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={assignOpen}
        onClose={() => !busy && setAssignOpen(false)}
        title={ar ? "تسليم مندوب للحساب" : "Assign Rider"}
        description={account.username}
        footer={<><Button variant="secondary" onClick={() => setAssignOpen(false)} disabled={busy}>{t("common.cancel")}</Button><Button onClick={assign} loading={busy}>{ar ? "تسليم" : "Assign"}</Button></>}
      >
        <div className="space-y-4">
          <Combobox label={ar ? "المندوب" : "Rider"} value={form.employee} onChange={(v) => setForm({ ...form, employee: v })} options={employees} placeholder={ar ? "اختر المندوب" : "Select rider"} required />
          <Select label={ar ? "الوردية" : "Shift"} value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} options={Object.entries(SHIFT).map(([v, l]) => ({ value: v, label: ar ? l[0] : l[1] }))} />
          <Textarea label={t("common.notes")} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
      </Modal>
    </>
  );
}
