"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, UserPlus, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Field";
import { Combobox } from "@/components/ui/Combobox";
import { ResourceForm, type FieldDef } from "@/components/data/ResourceForm";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useI18n } from "@/i18n/provider";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface OrderRow {
  _id: string;
  orderNumber: string;
  status: string;
  city?: string;
  customerName?: string;
  amount?: number;
  slaBreached?: boolean;
  placedAt: string;
  project?: { nameAr: string } | null;
  driver?: { nameAr: string } | null;
}

const STATUS: Record<string, [string, string, BadgeTone]> = {
  new: ["جديد", "New", "neutral"],
  assigned: ["مُسنَد", "Assigned", "info"],
  picked_up: ["تم الاستلام", "Picked Up", "info"],
  in_transit: ["قيد التوصيل", "In Transit", "warning"],
  delivered: ["تم التوصيل", "Delivered", "success"],
  failed: ["فشل", "Failed", "danger"],
  returned: ["مُرتجع", "Returned", "warning"],
  cancelled: ["ملغى", "Cancelled", "neutral"],
};
const FLOW: Record<string, string[]> = {
  new: ["assigned", "cancelled"],
  assigned: ["picked_up", "cancelled"],
  picked_up: ["in_transit", "failed"],
  in_transit: ["delivered", "failed", "returned"],
};

export function OrdersClient({
  initial,
  locale,
  title,
  projects,
  employees,
  cities,
}: {
  initial: ListResult<OrderRow>;
  locale: Locale;
  title: string;
  projects: { value: string; label: string }[];
  employees: { value: string; label: string }[];
  cities: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const ar = locale === "ar";

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OrderRow | null>(null);
  const [assignFor, setAssignFor] = useState<OrderRow | null>(null);
  const [driver, setDriver] = useState("");
  const [busy, setBusy] = useState(false);

  const sLabel = (v: string) => { const m = STATUS[v]; return m ? (ar ? m[0] : m[1]) : v; };

  const advance = async (order: OrderRow, status: string) => {
    const res = await fetch(`/api/ops/orders/${order._id}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (res.ok) { toast.success(ar ? "تم تحديث الحالة" : "Status updated"); router.refresh(); } else toast.error(t("common.somethingWentWrong"));
  };

  const assign = async () => {
    if (!driver || !assignFor) { toast.error(t("common.required")); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/ops/orders/${assignFor._id}/assign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ driver }) });
      if (res.ok) { toast.success(ar ? "تم إسناد المندوب" : "Driver assigned"); setAssignFor(null); setDriver(""); router.refresh(); } else toast.error(t("common.somethingWentWrong"));
    } finally { setBusy(false); }
  };

  const remove = async (order: OrderRow) => {
    const ok = await confirm({ title: t("common.deleteConfirmTitle"), body: order.orderNumber, tone: "danger", confirmLabel: t("common.delete") });
    if (!ok) return;
    const res = await fetch(`/api/ops/orders/${order._id}`, { method: "DELETE" });
    if (res.ok) { toast.success(t("common.deletedOk")); router.refresh(); } else toast.error(t("common.somethingWentWrong"));
  };

  const columns: Column<OrderRow>[] = [
    { key: "orderNumber", header: ar ? "رقم الطلب" : "Order #", sortable: true, cell: (r) => <div><span className="font-mono font-medium text-fg" dir="ltr">{r.orderNumber}</span>{r.slaBreached ? <Badge tone="danger" className="ms-2">SLA</Badge> : null}</div> },
    { key: "project", header: ar ? "المنصة" : "Platform", cell: (r) => <span className="text-sm text-fg-muted">{r.project?.nameAr ?? "—"}</span> },
    { key: "customer", header: ar ? "العميل" : "Customer", hideOnMobile: true, cell: (r) => <div className="min-w-0"><p className="truncate text-sm text-fg">{r.customerName || "—"}</p>{r.city && <p className="text-xs text-fg-subtle">{r.city}</p>}</div> },
    { key: "driver", header: ar ? "المندوب" : "Driver", cell: (r) => <span className="text-sm text-fg">{r.driver?.nameAr ?? <span className="text-fg-subtle">—</span>}</span> },
    { key: "amount", header: ar ? "المبلغ" : "Amount", align: "end", hideOnMobile: true, cell: (r) => <span className="tabular text-sm">{r.amount ? formatCurrency(r.amount, locale) : "—"}</span> },
    { key: "status", header: t("common.status"), align: "center", cell: (r) => { const m = STATUS[r.status]; return <Badge tone={m?.[2] ?? "neutral"} dot>{sLabel(r.status)}</Badge>; } },
    {
      key: "__actions", header: t("common.actions"), align: "end",
      cell: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {FLOW[r.status]?.[0] && (
            <Button variant="ghost" size="sm" onClick={() => advance(r, FLOW[r.status][0])} className="text-success" icon={<ChevronRight className="size-3.5 rtl:rotate-180" />}>
              {sLabel(FLOW[r.status][0])}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setAssignFor(r)} aria-label={ar ? "إسناد" : "Assign"} className="text-primary"><UserPlus className="size-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setFormOpen(true); }} aria-label={t("common.edit")}><Pencil className="size-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => remove(r)} aria-label={t("common.delete")} className="text-danger hover:bg-danger-soft"><Trash2 className="size-4" /></Button>
        </div>
      ),
    },
  ];

  const fields: FieldDef[] = [
    { key: "orderNumber", label: ar ? "رقم الطلب" : "Order Number", type: "text", required: true, dir: "ltr" },
    { key: "project", label: ar ? "المنصة" : "Platform", type: "select", options: projects },
    { key: "driver", label: ar ? "المندوب" : "Driver", type: "select", options: employees },
    { key: "status", label: t("common.status"), type: "select", options: Object.entries(STATUS).map(([v, l]) => ({ value: v, label: ar ? l[0] : l[1] })) },
    { key: "customerName", label: ar ? "اسم العميل" : "Customer Name", type: "text" },
    { key: "customerPhone", label: ar ? "هاتف العميل" : "Customer Phone", type: "text", dir: "ltr" },
    { key: "city", label: ar ? "المدينة" : "City", type: "text" },
    { key: "dropoffAddress", label: ar ? "عنوان التسليم" : "Dropoff Address", type: "text", span: 2 },
    { key: "amount", label: ar ? "قيمة الطلب" : "Order Amount", type: "number", dir: "ltr" },
    { key: "codAmount", label: ar ? "الدفع عند الاستلام" : "COD Amount", type: "number", dir: "ltr" },
    { key: "placedAt", label: ar ? "تاريخ الطلب" : "Placed At", type: "date" },
    { key: "slaDueAt", label: ar ? "موعد SLA" : "SLA Due", type: "date" },
  ];

  const openStats = { new: initial.rows.filter((r) => r.status === "new").length };

  return (
    <>
      <PageHeader
        title={title}
        description={`${initial.total} ${ar ? "طلب" : "orders"} · ${openStats.new} ${ar ? "جديد" : "new"}`}
        action={<Button onClick={() => { setEditing(null); setFormOpen(true); }} icon={<Plus className="size-4" />}>{ar ? "طلب جديد" : "New Order"}</Button>}
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
          { key: "status", label: t("common.status"), options: Object.entries(STATUS).map(([v, l]) => ({ value: v, label: ar ? l[0] : l[1] })) },
          { key: "project", label: ar ? "المنصة" : "Platform", options: projects },
          { key: "city", label: ar ? "المدينة" : "City", options: cities },
          { key: "sla", label: "SLA", options: [{ value: "breached", label: ar ? "متجاوز" : "Breached" }] },
        ]}
        dateField={{ key: "placedAt", label: ar ? "تاريخ الطلب" : "Placed" }}
        exportConfig={{ endpoint: "/api/ops/orders/export", filename: "orders" }}
      />

      <ResourceForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        fields={fields}
        endpoint="/api/ops/orders"
        editing={editing as unknown as Record<string, unknown> | null}
        titleCreate={ar ? "طلب جديد" : "New Order"}
        titleEdit={ar ? "تعديل طلب" : "Edit Order"}
        onSaved={() => { setFormOpen(false); router.refresh(); }}
      />

      <Modal
        open={assignFor !== null}
        onClose={() => !busy && setAssignFor(null)}
        title={ar ? "إسناد مندوب للطلب" : "Assign Driver"}
        description={assignFor?.orderNumber}
        footer={<><Button variant="secondary" onClick={() => setAssignFor(null)} disabled={busy}>{t("common.cancel")}</Button><Button onClick={assign} loading={busy}>{ar ? "إسناد" : "Assign"}</Button></>}
      >
        <Combobox label={ar ? "المندوب" : "Driver"} value={driver} onChange={setDriver} options={employees} placeholder={ar ? "اختر المندوب" : "Select driver"} required />
      </Modal>
    </>
  );
}
