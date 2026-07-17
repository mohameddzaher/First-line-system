"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Select, Input } from "@/components/ui/Field";
import { Combobox } from "@/components/ui/Combobox";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useI18n } from "@/i18n/provider";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

interface Line { description: string; quantity: number; unitPrice: number }
export interface OrderRow {
  _id: string;
  orderNumber: string;
  status: string;
  orderDate: string;
  total: number;
  supplier?: { name: string } | null;
  warehouse?: { name: string } | null;
  lines?: Line[];
  expectedDate?: string;
}

const STATUS = [
  ["draft", "مسودة", "Draft", "neutral"],
  ["pending", "قيد الاعتماد", "Pending", "warning"],
  ["approved", "معتمد", "Approved", "info"],
  ["received", "مُستلم", "Received", "success"],
  ["cancelled", "ملغى", "Cancelled", "danger"],
] as const;

export function OrdersClient({
  initial,
  locale,
  title,
  suppliers,
  warehouses,
}: {
  initial: ListResult<OrderRow>;
  locale: Locale;
  title: string;
  suppliers: { value: string; label: string }[];
  warehouses: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OrderRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [head, setHead] = useState({ orderNumber: "", supplier: "", warehouse: "", status: "draft", orderDate: "", expectedDate: "", vatRate: 15 });
  const [lines, setLines] = useState<Line[]>([{ description: "", quantity: 1, unitPrice: 0 }]);

  const statusMeta = (v: string) => STATUS.find((x) => x[0] === v);

  const openCreate = () => {
    setEditing(null);
    setHead({ orderNumber: `PO-${Date.now().toString().slice(-6)}`, supplier: "", warehouse: "", status: "draft", orderDate: "", expectedDate: "", vatRate: 15 });
    setLines([{ description: "", quantity: 1, unitPrice: 0 }]);
    setOpen(true);
  };
  const openEdit = (row: OrderRow) => {
    setEditing(row);
    setHead({ orderNumber: row.orderNumber, supplier: "", warehouse: "", status: row.status, orderDate: row.orderDate?.slice(0, 10) ?? "", expectedDate: row.expectedDate?.slice(0, 10) ?? "", vatRate: 15 });
    setLines(row.lines?.length ? row.lines : [{ description: "", quantity: 1, unitPrice: 0 }]);
    setOpen(true);
  };

  const subtotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
  const vat = subtotal * (head.vatRate / 100);

  const save = async () => {
    if (!head.orderNumber || !head.supplier) { toast.error(t("common.required")); return; }
    setBusy(true);
    try {
      const payload = { ...head, lines: lines.filter((l) => l.description.trim()) };
      const res = editing
        ? await fetch(`/api/procurement/orders/${editing._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/procurement/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { toast.success(editing ? t("common.updatedOk") : t("common.createdOk")); setOpen(false); router.refresh(); }
      else { const d = await res.json().catch(() => ({})); toast.error(d.error === "DUPLICATE" ? t("common.duplicateError") : t("common.somethingWentWrong")); }
    } finally { setBusy(false); }
  };

  const remove = async (row: OrderRow) => {
    const ok = await confirm({ title: t("common.deleteConfirmTitle"), body: row.orderNumber, tone: "danger", confirmLabel: t("common.delete") });
    if (!ok) return;
    const res = await fetch(`/api/procurement/orders/${row._id}`, { method: "DELETE" });
    if (res.ok) { toast.success(t("common.deletedOk")); router.refresh(); } else toast.error(t("common.somethingWentWrong"));
  };

  const columns: Column<OrderRow>[] = [
    { key: "orderNumber", header: locale === "ar" ? "رقم الأمر" : "PO #", sortable: true, cell: (r) => <span className="font-mono font-medium text-fg" dir="ltr">{r.orderNumber}</span> },
    { key: "supplier", header: locale === "ar" ? "المورّد" : "Supplier", cell: (r) => <span className="text-sm text-fg">{r.supplier?.name || "—"}</span> },
    { key: "orderDate", header: locale === "ar" ? "التاريخ" : "Date", sortable: true, hideOnMobile: true, cell: (r) => <span className="tabular text-sm">{formatDate(r.orderDate)}</span> },
    { key: "total", header: locale === "ar" ? "الإجمالي" : "Total", align: "end", sortable: true, cell: (r) => <span className="tabular font-medium">{formatCurrency(r.total, locale)}</span> },
    { key: "status", header: t("common.status"), align: "center", cell: (r) => { const m = statusMeta(r.status); return <Badge tone={(m?.[3] as never) ?? "neutral"} dot>{m ? (locale === "ar" ? m[1] : m[2]) : r.status}</Badge>; } },
    {
      key: "__actions", header: t("common.actions"), align: "end",
      cell: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => openEdit(r)} aria-label={t("common.edit")}><Pencil className="size-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => remove(r)} aria-label={t("common.delete")} className="text-danger hover:bg-danger-soft"><Trash2 className="size-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={title}
        description={`${initial.total} ${t("common.results")}`}
        action={<Button onClick={openCreate} icon={<Plus className="size-4" />}>{locale === "ar" ? "أمر شراء جديد" : "New PO"}</Button>}
      />

      <DataTable
        rows={initial.rows}
        columns={columns}
        total={initial.total}
        page={initial.page}
        limit={initial.limit}
        pages={initial.pages}
        rowKey={(r) => r._id}
        filters={[{ key: "status", label: t("common.status"), options: STATUS.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) }]}
        dateField={{ key: "orderDate", label: locale === "ar" ? "تاريخ الأمر" : "Order Date" }}
        exportConfig={{ endpoint: "/api/procurement/orders/export", filename: "purchase-orders" }}
      />

      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={editing ? (locale === "ar" ? "تعديل أمر شراء" : "Edit PO") : locale === "ar" ? "أمر شراء جديد" : "New Purchase Order"}
        size="xl"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>{t("common.cancel")}</Button><Button onClick={save} loading={busy}>{t("common.save")}</Button></>}
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label={locale === "ar" ? "رقم الأمر" : "PO Number"} value={head.orderNumber} onChange={(e) => setHead({ ...head, orderNumber: e.target.value })} dir="ltr" required />
            <div><Combobox label={locale === "ar" ? "المورّد" : "Supplier"} value={head.supplier} onChange={(v) => setHead({ ...head, supplier: v })} options={suppliers} placeholder={locale === "ar" ? "اختر المورّد" : "Select supplier"} required /></div>
            <Select label={locale === "ar" ? "المستودع" : "Warehouse"} value={head.warehouse} onChange={(e) => setHead({ ...head, warehouse: e.target.value })} options={warehouses} placeholder={t("common.none")} />
            <Select label={t("common.status")} value={head.status} onChange={(e) => setHead({ ...head, status: e.target.value })} options={STATUS.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] }))} />
            <Input type="date" label={locale === "ar" ? "تاريخ الأمر" : "Order Date"} value={head.orderDate} onChange={(e) => setHead({ ...head, orderDate: e.target.value })} />
            <Input type="date" label={locale === "ar" ? "التاريخ المتوقع" : "Expected Date"} value={head.expectedDate} onChange={(e) => setHead({ ...head, expectedDate: e.target.value })} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-fg">{locale === "ar" ? "البنود" : "Line Items"}</p>
              <Button variant="ghost" size="sm" onClick={() => setLines([...lines, { description: "", quantity: 1, unitPrice: 0 }])} icon={<Plus className="size-3.5" />}>{locale === "ar" ? "إضافة بند" : "Add line"}</Button>
            </div>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1"><Input label={i === 0 ? (locale === "ar" ? "الوصف" : "Description") : undefined} value={line.description} onChange={(e) => { const n = [...lines]; n[i].description = e.target.value; setLines(n); }} /></div>
                  <div className="w-20"><Input label={i === 0 ? (locale === "ar" ? "كمية" : "Qty") : undefined} type="number" dir="ltr" value={line.quantity} onChange={(e) => { const n = [...lines]; n[i].quantity = Number(e.target.value); setLines(n); }} /></div>
                  <div className="w-28"><Input label={i === 0 ? (locale === "ar" ? "السعر" : "Price") : undefined} type="number" dir="ltr" value={line.unitPrice} onChange={(e) => { const n = [...lines]; n[i].unitPrice = Number(e.target.value); setLines(n); }} /></div>
                  <Button variant="ghost" size="icon" onClick={() => setLines(lines.filter((_, j) => j !== i))} className="mb-0.5 text-danger" aria-label={t("common.delete")}><X className="size-4" /></Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <div className="w-56 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-fg-muted">{locale === "ar" ? "الإجمالي الفرعي" : "Subtotal"}</span><span className="tabular">{formatCurrency(subtotal, locale)}</span></div>
              <div className="flex justify-between"><span className="text-fg-muted">{locale === "ar" ? `ضريبة (${head.vatRate}%)` : `VAT (${head.vatRate}%)`}</span><span className="tabular">{formatCurrency(vat, locale)}</span></div>
              <div className="flex justify-between border-t border-border pt-1 font-semibold"><span>{locale === "ar" ? "الإجمالي" : "Total"}</span><span className="tabular">{formatCurrency(subtotal + vat, locale)}</span></div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
