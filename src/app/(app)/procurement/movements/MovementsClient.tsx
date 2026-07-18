"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select, Input } from "@/components/ui/Field";
import { Combobox } from "@/components/ui/Combobox";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/provider";
import { formatDateTime } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface MovementRow {
  _id: string;
  type: string;
  quantity: number;
  delta: number;
  balanceAfter: number;
  reason?: string;
  createdAt: string;
  item?: { name: string; sku?: string } | null;
}

const TYPES = [
  ["in", "إدخال", "In", "success"],
  ["out", "إخراج", "Out", "danger"],
  ["adjustment", "تسوية", "Adjustment", "warning"],
  ["transfer", "تحويل", "Transfer", "info"],
] as const;

export function MovementsClient({
  initial,
  locale,
  title,
  items,
}: {
  initial: ListResult<MovementRow>;
  locale: Locale;
  title: string;
  items: { value: string; label: string; hint?: string }[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ item: "", type: "in", quantity: "", reason: "", reference: "" });

  const typeMeta = (v: string) => TYPES.find((x) => x[0] === v);

  const submit = async () => {
    if (!form.item || !form.quantity) { toast.error(t("common.required")); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/procurement/movements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, quantity: Number(form.quantity) }) });
      if (res.ok) { toast.success(ar ? "تم تسجيل الحركة" : "Movement recorded"); setOpen(false); setForm({ item: "", type: "in", quantity: "", reason: "", reference: "" }); router.refresh(); }
      else { const d = await res.json().catch(() => ({})); toast.error(d.error === "INSUFFICIENT_STOCK" ? (ar ? `المخزون غير كافٍ (المتاح ${d.available})` : `Insufficient stock (available ${d.available})`) : t("common.somethingWentWrong")); }
    } finally { setBusy(false); }
  };

  const columns: Column<MovementRow>[] = [
    { key: "createdAt", header: t("common.date"), sortable: true, cell: (r) => <span className="tabular text-xs text-fg-muted">{formatDateTime(r.createdAt)}</span> },
    { key: "item", header: ar ? "الصنف" : "Item", cell: (r) => <span className="font-medium text-fg">{r.item?.name ?? "—"}</span> },
    { key: "type", header: t("common.type"), cell: (r) => { const m = typeMeta(r.type); return <Badge tone={(m?.[3] as never) ?? "neutral"}>{m ? (ar ? m[1] : m[2]) : r.type}</Badge>; } },
    { key: "delta", header: ar ? "التغيّر" : "Change", align: "center", cell: (r) => <span className={`tabular text-sm font-semibold ${r.delta >= 0 ? "text-success" : "text-danger"}`}>{r.delta >= 0 ? "+" : ""}{r.delta}</span> },
    { key: "balanceAfter", header: ar ? "الرصيد بعد" : "Balance", align: "center", cell: (r) => <span className="tabular text-sm text-fg">{r.balanceAfter}</span> },
    { key: "reason", header: ar ? "السبب" : "Reason", hideOnMobile: true, cell: (r) => <span className="text-sm text-fg-muted">{r.reason || "—"}</span> },
  ];

  return (
    <>
      <PageHeader
        title={title}
        description={`${initial.total} ${ar ? "حركة" : "movements"}`}
        action={<Button onClick={() => setOpen(true)} icon={<Plus className="size-4" />}>{ar ? "تسجيل حركة" : "Record Movement"}</Button>}
      />

      <DataTable
        rows={initial.rows}
        columns={columns}
        total={initial.total}
        page={initial.page}
        limit={initial.limit}
        pages={initial.pages}
        rowKey={(r) => r._id}
        filters={[{ key: "type", label: t("common.type"), options: TYPES.map((x) => ({ value: x[0], label: ar ? x[1] : x[2] })) }]}
        dateField={{ key: "createdAt", label: t("common.date") }}
        exportConfig={{ endpoint: "/api/procurement/movements/export", filename: "stock-movements" }}
      />

      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={ar ? "تسجيل حركة مخزون" : "Record Stock Movement"}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>{t("common.cancel")}</Button><Button onClick={submit} loading={busy}>{t("common.save")}</Button></>}
      >
        <div className="space-y-4">
          <Combobox label={ar ? "الصنف" : "Item"} value={form.item} onChange={(v) => setForm({ ...form, item: v })} options={items} placeholder={ar ? "اختر الصنف" : "Select item"} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t("common.type")} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={TYPES.map((x) => ({ value: x[0], label: ar ? x[1] : x[2] }))} />
            <Input type="number" label={form.type === "adjustment" ? (ar ? "الكمية الجديدة" : "New Quantity") : (ar ? "الكمية" : "Quantity")} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} dir="ltr" required />
          </div>
          <Input label={ar ? "السبب" : "Reason"} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <Input label={ar ? "المرجع" : "Reference"} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} dir="ltr" />
          <p className="flex items-center gap-2 text-xs text-fg-subtle">
            {form.type === "in" ? <ArrowDownToLine className="size-3.5 text-success" /> : <ArrowUpFromLine className="size-3.5 text-danger" />}
            {ar ? "سيتم تحديث كمية المخزون تلقائياً." : "Inventory quantity updates automatically."}
          </p>
        </div>
      </Modal>
    </>
  );
}
