"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/provider";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { Locale } from "@/i18n/dictionaries";

const PO_STATUS: Record<string, [string, string, BadgeTone]> = {
  draft: ["مسودة", "Draft", "neutral"],
  pending: ["بانتظار الاعتماد", "Pending", "warning"],
  approved: ["معتمد", "Approved", "info"],
  received: ["مستلَم", "Received", "success"],
  cancelled: ["ملغى", "Cancelled", "danger"],
};

/** Allowed next states. `received` and `cancelled` are terminal. */
const PO_FLOW: Record<string, string[]> = {
  draft: ["pending", "cancelled"],
  pending: ["approved", "cancelled"],
  approved: ["received", "cancelled"],
};

interface Line {
  description: string;
  quantity: number;
  unitPrice: number;
  inventoryItem?: { _id: string; name: string; sku?: string; unit?: string } | null;
}

interface PODoc {
  _id: string;
  orderNumber: string;
  status: string;
  orderDate: string;
  expectedDate?: string | null;
  receivedDate?: string | null;
  subtotal: number;
  vat: number;
  total: number;
  notes?: string;
  lines: Line[];
  supplier?: { _id: string; name: string; nameAr?: string; phone?: string; email?: string } | null;
  warehouse?: { _id: string; nameAr: string; nameEn?: string } | null;
  approvedBy?: { firstName: string; lastName: string } | null;
}

interface Movement {
  _id: string;
  type: string;
  quantity: number;
  delta: number;
  balanceAfter: number;
  createdAt: string;
  item?: { name: string; sku?: string } | null;
}

interface AuditRow {
  _id: string;
  action: string;
  actorName?: string;
  createdAt: string;
}

export function PurchaseOrderDetail({
  locale,
  po,
  movements,
  history,
  canUpdate,
}: {
  locale: Locale;
  po: PODoc;
  movements: Movement[];
  history: AuditRow[];
  canUpdate: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const ar = locale === "ar";
  const [busy, setBusy] = useState(false);

  const label = (s: string) => {
    const m = PO_STATUS[s];
    return m ? (ar ? m[0] : m[1]) : s;
  };
  const tone = (s: string) => PO_STATUS[s]?.[2] ?? "neutral";
  const moves = canUpdate ? (PO_FLOW[po.status] ?? []) : [];

  async function move(next: string) {
    const ok = await confirm({
      title: label(next),
      body:
        next === "received"
          ? ar
            ? "سيتم تسجيل الاستلام وزيادة أرصدة المخزون للبنود المرتبطة بأصناف. لا يمكن التراجع."
            : "This records receipt and increases stock for every line linked to an inventory item. It cannot be undone."
          : next === "cancelled"
            ? ar
              ? "سيتم إلغاء أمر الشراء."
              : "This purchase order will be cancelled."
            : ar
              ? "سيتم تحديث حالة أمر الشراء."
              : "The purchase order status will be updated.",
      tone: next === "cancelled" ? "danger" : "info",
    });
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/procurement/orders/${po._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        toast.success(
          next === "received"
            ? ar
              ? "تم الاستلام وتحديث المخزون"
              : "Received — inventory updated"
            : ar
              ? "تم تحديث الحالة"
              : "Status updated",
        );
        router.refresh();
      } else {
        toast.error(t("common.somethingWentWrong"));
      }
    } catch {
      toast.error(t("common.somethingWentWrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title={po.orderNumber}
        action={
          <Link href="/procurement/orders">
            <Button variant="ghost" icon={<ArrowLeft className="size-4 rtl:rotate-180" />}>
              {ar ? "عودة إلى أوامر الشراء" : "Back to purchase orders"}
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={tone(po.status)} dot>
          {label(po.status)}
        </Badge>
        {po.supplier ? (
          <Link href={`/crm/companies/${po.supplier._id}`} className="text-sm text-primary hover:underline">
            {ar ? (po.supplier.nameAr ?? po.supplier.name) : po.supplier.name}
          </Link>
        ) : null}
        {moves.length > 0 ? (
          <div className="ms-auto flex flex-wrap gap-2">
            {moves.map((next) => (
              <Button
                key={next}
                size="sm"
                variant={next === "received" ? "primary" : next === "cancelled" ? "ghost" : "secondary"}
                icon={next === "received" ? <PackageCheck className="size-4" /> : undefined}
                onClick={() => move(next)}
                disabled={busy}
              >
                {label(next)}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2">
          <Card>
            <CardHeader title={ar ? "البنود" : "Line items"} />
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-xs text-fg-muted">
                    <tr>
                      <th className="p-3 text-start font-medium">{ar ? "الصنف" : "Item"}</th>
                      <th className="p-3 text-center font-medium">{ar ? "الكمية" : "Qty"}</th>
                      <th className="p-3 text-center font-medium">{ar ? "سعر الوحدة" : "Unit price"}</th>
                      <th className="p-3 text-end font-medium">{ar ? "الإجمالي" : "Total"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {po.lines.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-fg-muted">
                          {ar ? "لا توجد بنود" : "No line items"}
                        </td>
                      </tr>
                    ) : (
                      po.lines.map((line, index) => (
                        <tr key={`${line.description}-${index}`}>
                          <td className="p-3">
                            <p className="font-medium text-fg">{line.description}</p>
                            {line.inventoryItem ? (
                              <Link
                                href={`/procurement/inventory`}
                                className="text-xs text-primary hover:underline"
                              >
                                {line.inventoryItem.name}
                                {line.inventoryItem.sku ? ` · ${line.inventoryItem.sku}` : ""}
                              </Link>
                            ) : (
                              <span className="text-xs text-fg-subtle">
                                {ar ? "غير مرتبط بصنف مخزون" : "Not linked to an inventory item"}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center tabular">{line.quantity}</td>
                          <td className="p-3 text-center tabular">
                            {formatCurrency(line.unitPrice, locale)}
                          </td>
                          <td className="p-3 text-end font-medium tabular">
                            {formatCurrency(line.quantity * line.unitPrice, locale)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="border-t border-border">
                    <tr>
                      <td colSpan={3} className="p-3 text-end text-fg-muted">
                        {ar ? "المجموع الفرعي" : "Subtotal"}
                      </td>
                      <td className="p-3 text-end tabular">{formatCurrency(po.subtotal, locale)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="p-3 text-end text-fg-muted">
                        {ar ? "ضريبة القيمة المضافة" : "VAT"}
                      </td>
                      <td className="p-3 text-end tabular">{formatCurrency(po.vat, locale)}</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td colSpan={3} className="p-3 text-end font-semibold text-fg">
                        {ar ? "الإجمالي" : "Total"}
                      </td>
                      <td className="p-3 text-end text-base font-bold tabular text-fg">
                        {formatCurrency(po.total, locale)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={ar ? "حركات المخزون الناتجة" : "Resulting stock movements"}
              description={
                ar
                  ? "تُنشأ تلقائياً عند استلام أمر الشراء."
                  : "Created automatically when the order is received."
              }
            />
            <CardBody>
              {movements.length === 0 ? (
                <EmptyState
                  title={ar ? "لا توجد حركات بعد" : "No movements yet"}
                  description={
                    ar ? "ستظهر بعد استلام الأمر." : "They appear once the order is received."
                  }
                />
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {movements.map((m) => (
                    <li key={m._id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span className="text-fg">
                        {m.item?.name ?? "—"}
                      </span>
                      <span className="flex items-center gap-3">
                        <span
                          className={m.delta >= 0 ? "font-medium text-success" : "font-medium text-danger"}
                        >
                          {m.delta >= 0 ? "+" : ""}
                          {m.delta}
                        </span>
                        <span className="text-xs text-fg-muted">
                          {ar ? "الرصيد" : "balance"}: {m.balanceAfter}
                        </span>
                        <span className="text-xs text-fg-muted">{formatDateTime(m.createdAt)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={ar ? "سجل التدقيق" : "Audit history"} />
            <CardBody>
              {history.length === 0 ? (
                <EmptyState title={ar ? "لا يوجد سجل" : "No history"} />
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {history.map((row) => (
                    <li key={row._id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span className="text-fg">
                        {row.actorName ?? "—"} · {row.action}
                      </span>
                      <span className="text-xs text-fg-muted">{formatDateTime(row.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader title={ar ? "المورّد" : "Supplier"} />
            <CardBody>
              {po.supplier ? (
                <div className="space-y-1 text-sm">
                  <Link
                    href={`/crm/companies/${po.supplier._id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {ar ? (po.supplier.nameAr ?? po.supplier.name) : po.supplier.name}
                  </Link>
                  {po.supplier.phone ? (
                    <p className="text-fg-muted" dir="ltr">
                      {po.supplier.phone}
                    </p>
                  ) : null}
                  {po.supplier.email ? (
                    <p className="text-fg-muted" dir="ltr">
                      {po.supplier.email}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-fg-muted">—</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={ar ? "البيانات" : "Details"} />
            <CardBody>
              <dl className="grid gap-3 text-sm">
                <Row label={ar ? "المستودع" : "Warehouse"}>
                  {po.warehouse ? (
                    <Link href="/procurement/warehouses" className="text-primary hover:underline">
                      {ar ? po.warehouse.nameAr : (po.warehouse.nameEn ?? po.warehouse.nameAr)}
                    </Link>
                  ) : (
                    "—"
                  )}
                </Row>
                <Row label={ar ? "تاريخ الأمر" : "Order date"}>{formatDate(po.orderDate)}</Row>
                <Row label={ar ? "التاريخ المتوقع" : "Expected"}>
                  {po.expectedDate ? formatDate(po.expectedDate) : "—"}
                </Row>
                <Row label={ar ? "تاريخ الاستلام" : "Received"}>
                  {po.receivedDate ? formatDate(po.receivedDate) : "—"}
                </Row>
                <Row label={ar ? "اعتمده" : "Approved by"}>
                  {po.approvedBy ? `${po.approvedBy.firstName} ${po.approvedBy.lastName}` : "—"}
                </Row>
              </dl>
            </CardBody>
          </Card>

          {po.notes ? (
            <Card>
              <CardHeader title={ar ? "ملاحظات" : "Notes"} />
              <CardBody>
                <p className="whitespace-pre-wrap text-sm text-fg">{po.notes}</p>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>

    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="font-medium text-fg">{children}</dd>
    </div>
  );
}
