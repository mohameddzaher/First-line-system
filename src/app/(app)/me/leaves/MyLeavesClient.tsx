"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/StatCard";
import { Modal } from "@/components/ui/Modal";
import { Select, Input, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/provider";
import { statusInfo } from "@/lib/statusMeta";
import { formatDate } from "@/lib/utils";
import type { Locale } from "@/i18n/dictionaries";

interface LeaveItem {
  _id: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  leaveType?: { nameAr: string; nameEn: string } | null;
}

export function MyLeavesClient({
  linked,
  title,
  locale,
  leaves,
  leaveTypes,
  balance,
}: {
  linked: boolean;
  title: string;
  locale: Locale;
  leaves: LeaveItem[];
  leaveTypes: { value: string; label: string }[];
  balance: { annualEntitlement: number; accruedToDate: number; taken: number; available: number } | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ leaveType: "", startDate: "", endDate: "", reason: "" });

  if (!linked) {
    return (
      <>
        <PageHeader title={title} />
        <Card>
          <EmptyState title={locale === "ar" ? "لا يوجد ملف موظف مرتبط" : "No linked employee profile"} description={locale === "ar" ? "يُرجى مراجعة الموارد البشرية." : "Please contact HR."} />
        </Card>
      </>
    );
  }

  const submit = async () => {
    if (!form.leaveType || !form.startDate || !form.endDate) {
      toast.error(t("common.required"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/me/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(locale === "ar" ? "تم إرسال طلب الإجازة" : "Leave request submitted");
        setOpen(false);
        setForm({ leaveType: "", startDate: "", endDate: "", reason: "" });
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error === "INVALID_RANGE" ? (locale === "ar" ? "نطاق التواريخ غير صحيح" : "Invalid date range") : t("common.somethingWentWrong"));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={title}
        action={<Button onClick={() => setOpen(true)} icon={<Plus className="size-4" />}>{locale === "ar" ? "طلب إجازة" : "Request Leave"}</Button>}
      />

      {balance && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label={locale === "ar" ? "الاستحقاق السنوي" : "Annual"} value={`${balance.annualEntitlement}`} />
          <StatCard label={locale === "ar" ? "المُستحق" : "Accrued"} value={`${balance.accruedToDate}`} />
          <StatCard label={locale === "ar" ? "المستهلك" : "Taken"} value={`${balance.taken}`} />
          <StatCard label={locale === "ar" ? "المتاح" : "Available"} value={`${balance.available}`} tone="success" />
        </div>
      )}

      <Card>
        {leaves.length === 0 ? (
          <EmptyState title={locale === "ar" ? "لا توجد إجازات" : "No leaves yet"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-subtle text-xs text-fg-muted">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t("common.type")}</th>
                  <th className="px-4 py-3 text-start font-medium">{locale === "ar" ? "الفترة" : "Period"}</th>
                  <th className="px-4 py-3 text-center font-medium">{locale === "ar" ? "الأيام" : "Days"}</th>
                  <th className="px-4 py-3 text-center font-medium">{t("common.status")}</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => {
                  const info = statusInfo("leave", l.status);
                  return (
                    <tr key={l._id} className="border-t border-border">
                      <td className="px-4 py-3 text-fg">{l.leaveType ? (locale === "ar" ? l.leaveType.nameAr : l.leaveType.nameEn) : "—"}</td>
                      <td className="px-4 py-3 tabular text-fg-muted">{formatDate(l.startDate)} → {formatDate(l.endDate)}</td>
                      <td className="px-4 py-3 text-center tabular font-medium">{l.days}</td>
                      <td className="px-4 py-3 text-center"><Badge tone={info.tone} dot>{locale === "ar" ? info.ar : info.en}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={locale === "ar" ? "طلب إجازة جديد" : "New Leave Request"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>{t("common.cancel")}</Button>
            <Button onClick={submit} loading={busy}>{locale === "ar" ? "إرسال" : "Submit"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label={t("common.type")} value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })} options={leaveTypes} placeholder={locale === "ar" ? "اختر نوع الإجازة" : "Select leave type"} required />
          <div className="grid grid-cols-2 gap-4">
            <Input type="date" label={locale === "ar" ? "من تاريخ" : "Start Date"} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            <Input type="date" label={locale === "ar" ? "إلى تاريخ" : "End Date"} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          </div>
          <Textarea label={locale === "ar" ? "السبب" : "Reason"} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </div>
      </Modal>
    </>
  );
}
