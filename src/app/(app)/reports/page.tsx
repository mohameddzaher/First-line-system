import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Employee } from "@/models/Employee";
import { Vehicle } from "@/models/Vehicle";
import { FinanceTransaction } from "@/models/FinanceTransaction";
import { ThirdPartyAccount } from "@/models/ThirdPartyAccount";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Donut } from "@/components/charts/Donut";
import { HBars } from "@/components/charts/Bars";
import { TrendChart } from "@/components/charts/TrendChart";
import { monthlySeries } from "@/lib/analytics";
import { statusLabel } from "@/lib/statusMeta";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requirePermission("reports.view:read");
  await connectDB();
  const locale = await getLocale();
  const ar = locale === "ar";

  const [ordersByStatus, ordersByPlatform, ordersTrend, driversByCity, vehiclesByCity, empByNat, finance, ridersByProject] = await Promise.all([
    Order.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { project: { $ne: null } } }, { $group: { _id: "$project", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 8 }, { $lookup: { from: "projects", localField: "_id", foreignField: "_id", as: "p" } }, { $project: { n: 1, name: { $first: "$p.nameAr" } } }]),
    monthlySeries(Order, "placedAt", 12, locale),
    Employee.aggregate([{ $match: { isDriver: true, workLocation: { $ne: null } } }, { $group: { _id: "$workLocation", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 8 }]),
    Vehicle.aggregate([{ $match: { city: { $ne: null } } }, { $group: { _id: "$city", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 8 }]),
    Employee.aggregate([{ $group: { _id: "$nationality", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 8 }]),
    FinanceTransaction.aggregate([{ $match: { status: { $ne: "void" } } }, { $group: { _id: "$kind", v: { $sum: "$amount" } } }]),
    ThirdPartyAccount.aggregate([{ $unwind: "$assignments" }, { $match: { "assignments.active": true } }, { $group: { _id: "$project", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 8 }, { $lookup: { from: "projects", localField: "_id", foreignField: "_id", as: "p" } }, { $project: { n: 1, name: { $first: "$p.nameAr" } } }]),
  ]);

  const ORDER_STATUS_COLOR: Record<string, string> = { new: "info", assigned: "info", picked_up: "info", in_transit: "warning", delivered: "success", failed: "danger", returned: "warning", cancelled: "neutral" };
  const ORDER_STATUS_LABEL: Record<string, [string, string]> = { new: ["جديد", "New"], assigned: ["مُسنَد", "Assigned"], picked_up: ["استلام", "Picked Up"], in_transit: ["قيد التوصيل", "In Transit"], delivered: ["تم التوصيل", "Delivered"], failed: ["فشل", "Failed"], returned: ["مُرتجع", "Returned"], cancelled: ["ملغى", "Cancelled"] };
  const orderStatusData = ordersByStatus.map((r: { _id: string; n: number }) => ({ label: ORDER_STATUS_LABEL[r._id]?.[ar ? 0 : 1] ?? r._id, value: r.n, color: ORDER_STATUS_COLOR[r._id] === "neutral" ? "info" : ORDER_STATUS_COLOR[r._id] ?? "primary" }));
  const rev = finance.find((f: { _id: string; v: number }) => f._id === "revenue")?.v ?? 0;
  const exp = finance.find((f: { _id: string; v: number }) => f._id === "expense")?.v ?? 0;

  return (
    <>
      <PageHeader title={ar ? "التقارير والتحليلات" : "Reports & BI"} description={ar ? "تحليلات حيّة عبر كل الأقسام" : "Live analytics across all departments"} />

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader title={ar ? "الطلبات — ١٢ شهرًا" : "Orders — 12 months"} /><CardBody><TrendChart data={ordersTrend} color="primary" /></CardBody></Card>
        <Card><CardHeader title={ar ? "الطلبات حسب الحالة" : "Orders by status"} /><CardBody>{orderStatusData.length ? <Donut data={orderStatusData} centerLabel={ar ? "طلب" : "orders"} /> : <p className="text-sm text-fg-subtle">{ar ? "لا توجد طلبات بعد" : "No orders yet"}</p>}</CardBody></Card>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card><CardHeader title={ar ? "الطلبات حسب المنصة" : "Orders by platform"} /><CardBody>{ordersByPlatform.length ? <HBars data={ordersByPlatform.map((r: { name?: string; n: number }) => ({ label: r.name || "—", value: r.n }))} color="accent" /> : <p className="text-sm text-fg-subtle">—</p>}</CardBody></Card>
        <Card><CardHeader title={ar ? "المناديب النشطون حسب المشروع" : "Active riders by project"} /><CardBody><HBars data={ridersByProject.map((r: { name?: string; n: number }) => ({ label: r.name || "—", value: r.n }))} color="primary" /></CardBody></Card>
        <Card><CardHeader title={ar ? "الأرباح والخسائر" : "Profit & Loss"} /><CardBody className="flex h-full flex-col justify-center gap-3">
          <PLRow label={ar ? "الإيرادات" : "Revenue"} value={formatCurrency(rev, locale)} tone="text-success" />
          <PLRow label={ar ? "المصروفات" : "Expenses"} value={formatCurrency(exp, locale)} tone="text-danger" />
          <div className="border-t border-border pt-3"><PLRow label={ar ? "الصافي" : "Net"} value={formatCurrency(rev - exp, locale)} tone={rev - exp >= 0 ? "text-success" : "text-danger"} big /></div>
        </CardBody></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card><CardHeader title={ar ? "المناديب حسب المدينة" : "Drivers by city"} /><CardBody><HBars data={driversByCity.map((r: { _id: string; n: number }) => ({ label: r._id || "—", value: r.n }))} color="info" /></CardBody></Card>
        <Card><CardHeader title={ar ? "المركبات حسب المدينة" : "Vehicles by city"} /><CardBody><HBars data={vehiclesByCity.map((r: { _id: string; n: number }) => ({ label: r._id || "—", value: r.n }))} color="primary" /></CardBody></Card>
        <Card><CardHeader title={ar ? "الموظفون حسب الجنسية" : "Employees by nationality"} /><CardBody><HBars data={empByNat.map((r: { _id: string; n: number }) => ({ label: r._id || "—", value: r.n }))} color="accent" /></CardBody></Card>
      </div>
    </>
  );
}

function PLRow({ label, value, tone, big }: { label: string; value: string; tone: string; big?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={big ? "text-sm font-semibold text-fg" : "text-sm text-fg-muted"}>{label}</span>
      <span className={`tabular font-bold ${tone} ${big ? "text-xl" : "text-base"}`}>{value}</span>
    </div>
  );
}
