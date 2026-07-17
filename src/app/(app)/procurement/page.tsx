import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { PurchaseOrder } from "@/models/PurchaseOrder";
import { InventoryItem } from "@/models/InventoryItem";
import { Warehouse } from "@/models/Warehouse";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Donut } from "@/components/charts/Donut";
import { HBars } from "@/components/charts/Bars";
import { TrendChart } from "@/components/charts/TrendChart";
import { monthlySumSeries } from "@/lib/analytics";
import { ShoppingCart, Boxes, Warehouse as WHIcon, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Procurement" };
export const dynamic = "force-dynamic";

export default async function ProcurementDashboard() {
  await requirePermission("procurement.dashboard:read");
  await connectDB();
  const locale = await getLocale();
  const ar = locale === "ar";

  const [openPOs, poValue, items, lowStock, outStock, warehouses, poByStatus, invByCategory, invByWarehouse, spendTrend, lowItems] =
    await Promise.all([
      PurchaseOrder.countDocuments({ status: { $in: ["draft", "pending", "approved"] } }),
      PurchaseOrder.aggregate([{ $match: { status: { $ne: "cancelled" } } }, { $group: { _id: null, v: { $sum: "$total" } } }]),
      InventoryItem.countDocuments({}),
      InventoryItem.countDocuments({ $expr: { $lte: ["$quantity", "$reorderLevel"] } }),
      InventoryItem.countDocuments({ quantity: 0 }),
      Warehouse.countDocuments({ isActive: true }),
      PurchaseOrder.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
      InventoryItem.aggregate([{ $match: { category: { $ne: null } } }, { $group: { _id: "$category", n: { $sum: "$quantity" } } }, { $sort: { n: -1 } }, { $limit: 6 }]),
      InventoryItem.aggregate([{ $group: { _id: "$warehouse", n: { $sum: "$quantity" } } }, { $sort: { n: -1 } }, { $limit: 6 }, { $lookup: { from: "warehouses", localField: "_id", foreignField: "_id", as: "w" } }, { $project: { n: 1, name: { $first: "$w.name" } } }]),
      monthlySumSeries(PurchaseOrder, "orderDate", "total", 12, locale, { status: { $ne: "cancelled" } }),
      InventoryItem.find({ $expr: { $lte: ["$quantity", "$reorderLevel"] } }).populate("warehouse", "name").sort({ quantity: 1 }).limit(6).lean(),
    ]);

  const g = (rows: { _id: string; n: number }[], k: string) => rows.find((r) => r._id === k)?.n ?? 0;
  const PO_STATUS: Record<string, [string, string, string]> = { draft: ["مسودة", "Draft", "neutral"], pending: ["قيد الاعتماد", "Pending", "warning"], approved: ["معتمد", "Approved", "info"], received: ["مُستلم", "Received", "success"], cancelled: ["ملغى", "Cancelled", "danger"] };
  const poStatusData = poByStatus.map((r: { _id: string; n: number }) => ({ label: PO_STATUS[r._id]?.[ar ? 0 : 1] ?? r._id, value: r.n, color: PO_STATUS[r._id]?.[2] === "neutral" ? "info" : PO_STATUS[r._id]?.[2] ?? "primary" }));

  const kpis = [
    { label: ar ? "أوامر شراء مفتوحة" : "Open POs", value: openPOs, icon: <ShoppingCart className="size-5" />, tone: "info" as const, href: "/procurement/orders" },
    { label: ar ? "قيمة الأوامر" : "PO Value", value: formatCurrency(poValue[0]?.v ?? 0, locale), tone: "neutral" as const, href: "/procurement/orders" },
    { label: ar ? "أصناف المخزون" : "Inventory Items", value: items, icon: <Boxes className="size-5" />, tone: "neutral" as const, href: "/procurement/inventory" },
    { label: ar ? "مخزون منخفض" : "Low Stock", value: lowStock, icon: <AlertTriangle className="size-5" />, tone: "warning" as const, href: "/procurement/inventory" },
    { label: ar ? "نفد المخزون" : "Out of Stock", value: outStock, tone: "danger" as const, href: "/procurement/inventory" },
    { label: ar ? "المستودعات" : "Warehouses", value: warehouses, icon: <WHIcon className="size-5" />, tone: "neutral" as const, href: "/procurement/warehouses" },
  ];

  return (
    <>
      <PageHeader title={ar ? "لوحة المشتريات" : "Procurement Dashboard"} />
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => <StatCard key={k.label} {...k} />)}
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={ar ? "إنفاق المشتريات — ١٢ شهرًا" : "Procurement spend — last 12 months"} />
          <CardBody><TrendChart data={spendTrend} color="accent" /></CardBody>
        </Card>
        <Card>
          <CardHeader title={ar ? "أوامر الشراء حسب الحالة" : "POs by status"} />
          <CardBody>{poStatusData.length ? <Donut data={poStatusData} centerLabel={ar ? "أمر" : "POs"} /> : <p className="text-sm text-fg-subtle">—</p>}</CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title={ar ? "المخزون حسب الفئة" : "Stock by category"} />
          <CardBody><HBars data={invByCategory.map((r: { _id: string; n: number }) => ({ label: r._id || "—", value: r.n }))} color="primary" unit={ar ? "قطعة" : "units"} /></CardBody>
        </Card>
        <Card>
          <CardHeader title={ar ? "المخزون حسب المستودع" : "Stock by warehouse"} />
          <CardBody><HBars data={invByWarehouse.map((r: { name?: string; n: number }) => ({ label: r.name || "—", value: r.n }))} color="info" unit={ar ? "قطعة" : "units"} /></CardBody>
        </Card>
        <Card>
          <CardHeader title={ar ? "أصناف تحتاج إعادة طلب" : "Items to reorder"} action={<Link href="/procurement/inventory" className="text-xs font-medium text-primary hover:underline">{ar ? "المخزون" : "Inventory"}</Link>} />
          <div className="divide-y divide-border">
            {lowItems.length === 0 && <p className="p-5 text-sm text-fg-subtle">{ar ? "المخزون بحالة جيدة" : "Stock is healthy"}</p>}
            {(lowItems as unknown as { _id: string; name: string; quantity: number; reorderLevel: number; warehouse?: { name?: string } }[]).map((it) => (
              <div key={String(it._id)} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">{it.name}</p>
                  <p className="truncate text-xs text-fg-muted">{it.warehouse?.name ?? "—"}</p>
                </div>
                <span className={`tabular text-sm font-semibold ${it.quantity === 0 ? "text-danger" : "text-warning"}`}>{it.quantity} / {it.reorderLevel}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
