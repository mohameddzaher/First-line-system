"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select, Input, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/provider";
import { statusInfo } from "@/lib/statusMeta";
import { formatDateTime } from "@/lib/utils";
import type { Locale } from "@/i18n/dictionaries";

interface RequestItem {
  _id: string;
  subject: string;
  category: string;
  status: string;
  createdAt: string;
}

const CATEGORIES = [
  ["salary_certificate", "شهادة راتب", "Salary Certificate"],
  ["salary_definition", "تعريف بالراتب", "Salary Definition"],
  ["experience_certificate", "شهادة خبرة", "Experience Certificate"],
  ["leave_balance", "رصيد الإجازات", "Leave Balance"],
  ["advance", "سلفة", "Advance"],
  ["loan", "قرض", "Loan"],
  ["transfer", "نقل", "Transfer"],
  ["resignation", "استقالة", "Resignation"],
  ["complaint", "شكوى", "Complaint"],
  ["other", "أخرى", "Other"],
] as const;

export function MyRequestsClient({
  linked,
  title,
  locale,
  requests,
}: {
  linked: boolean;
  title: string;
  locale: Locale;
  requests: RequestItem[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ category: "other", subject: "", body: "" });

  const catLabel = (v: string) => {
    const f = CATEGORIES.find((x) => x[0] === v);
    return f ? (locale === "ar" ? f[1] : f[2]) : v;
  };

  if (!linked) {
    return (
      <>
        <PageHeader title={title} />
        <Card><EmptyState title={locale === "ar" ? "لا يوجد ملف موظف مرتبط" : "No linked employee profile"} description={locale === "ar" ? "يُرجى مراجعة الموارد البشرية." : "Please contact HR."} /></Card>
      </>
    );
  }

  const submit = async () => {
    if (!form.subject.trim()) {
      toast.error(t("common.required"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/me/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(locale === "ar" ? "تم إرسال الطلب" : "Request submitted");
        setOpen(false);
        setForm({ category: "other", subject: "", body: "" });
        router.refresh();
      } else {
        toast.error(t("common.somethingWentWrong"));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={title}
        action={<Button onClick={() => setOpen(true)} icon={<Plus className="size-4" />}>{locale === "ar" ? "طلب جديد" : "New Request"}</Button>}
      />

      <Card>
        {requests.length === 0 ? (
          <EmptyState title={locale === "ar" ? "لا توجد طلبات" : "No requests yet"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-subtle text-xs text-fg-muted">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{locale === "ar" ? "الفئة" : "Category"}</th>
                  <th className="px-4 py-3 text-start font-medium">{locale === "ar" ? "الموضوع" : "Subject"}</th>
                  <th className="px-4 py-3 text-center font-medium">{t("common.status")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("common.date")}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const info = statusInfo("request", r.status);
                  return (
                    <tr key={r._id} className="border-t border-border">
                      <td className="px-4 py-3 text-fg-muted">{catLabel(r.category)}</td>
                      <td className="px-4 py-3 text-fg">{r.subject}</td>
                      <td className="px-4 py-3 text-center"><Badge tone={info.tone} dot>{locale === "ar" ? info.ar : info.en}</Badge></td>
                      <td className="px-4 py-3 tabular text-xs text-fg-muted">{formatDateTime(r.createdAt)}</td>
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
        title={locale === "ar" ? "طلب جديد" : "New Request"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>{t("common.cancel")}</Button>
            <Button onClick={submit} loading={busy}>{locale === "ar" ? "إرسال" : "Submit"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label={locale === "ar" ? "الفئة" : "Category"} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={CATEGORIES.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] }))} />
          <Input label={locale === "ar" ? "الموضوع" : "Subject"} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
          <Textarea label={locale === "ar" ? "التفاصيل" : "Details"} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </div>
      </Modal>
    </>
  );
}
