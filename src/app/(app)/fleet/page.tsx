import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Vehicle } from "@/models/Vehicle";
import { Accident } from "@/models/Accident";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Donut } from "@/components/charts/Donut";
import { HBars } from "@/components/charts/Bars";
import { TrendChart } from "@/components/charts/TrendChart";
import { monthlySeries } from "@/lib/analytics";
import { statusLabel } from "@/lib/statusMeta";
import { Truck, ShieldCheck, AlertTriangle, Wrench } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Vehicles Dashboard" };
export const dynamic = "force-dynamic";

export default async function FleetDashboard() {
  await requirePermission("fleet.dashboard:read");
  await connectDB();
  const locale = await getLocale();
  const ar = locale === "ar";

  const [total, authorized, maintenance, byType, byStatus, byDept, openAccidents, totalAccidents, costAgg, accBySeverity, authTrend] =
    await Promise.all([
      Vehicle.countDocuments({}),
      Vehicle.countDocuments({ status: "authorized" }),
      Vehicle.countDocuments({ status: "maintenance" }),
      Vehicle.aggregate([{ $group: { _id: "$type", n: { $sum: 1 } } }]),
      Vehicle.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
      Vehicle.aggregate([{ $match: { department: { $ne: null } } }, { $group: { _id: "$department", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 6 }, { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "d" } }, { $project: { n: 1, name: { $first: "$d.nameAr" } } }]),
      Accident.countDocuments({ status: { $ne: "closed" } }),
      Accident.countDocuments({}),
      Accident.aggregate([{ $group: { _id: null, est: { $sum: "$estimatedCost" }, act: { $sum: "$actualCost" } } }]),
      Accident.aggregate([{ $group: { _id: "$severity", n: { $sum: 1 } } }]),
      monthlySeries(Vehicle, "createdAt", 12, locale),
    ]);

  const byCity = await Vehicle.aggregate([{ $match: { city: { $ne: null } } }, { $group: { _id: "$city", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 8 }]);

  const g = (rows: { _id: string; n: number }[], k: string) => rows.find((r) => r._id === k)?.n ?? 0;

  const typeData = [
    { label: ar ? "سيارة" : "Car", value: g(byType, "car"), color: "primary" },
    { label: ar ? "دراجة آلية" : "Motorcycle", value: g(byType, "motorcycle"), color: "accent" },
    { label: ar ? "شاحنة ثقيلة" : "Heavy Truck", value: g(byType, "heavy_truck"), color: "info" },
  ];
  const STATUS_COLOR: Record<string, string> = { authorized: "success", available: "info", parked: "neutral", maintenance: "warning", no_plate: "warning", impounded: "danger", withdrawn: "neutral", stolen: "danger", out_of_service: "danger" };
  const statusData = byStatus.map((r: { _id: string; n: number }) => ({ label: statusLabel("vehicle", r._id, locale), value: r.n, color: STATUS_COLOR[r._id] === "neutral" ? "info" : STATUS_COLOR[r._id] ?? "primary" }));
  const SEV_LABEL: Record<string, [string, string, string]> = { minor: ["بسيط", "Minor", "info"], moderate: ["متوسط", "Moderate", "warning"], major: ["كبير", "Major", "danger"], total_loss: ["خسارة كلية", "Total Loss", "danger"] };
  const sevData = accBySeverity.map((r: { _id: string; n: number }) => ({ label: SEV_LABEL[r._id]?.[ar ? 0 : 1] ?? r._id, value: r.n, color: SEV_LABEL[r._id]?.[2] ?? "neutral" }));

  const kpis = [
    { label: ar ? "إجمالي المركبات" : "Total Vehicles", value: total, icon: <Truck className="size-5" />, tone: "neutral" as const, href: "/fleet/vehicles" },
    { label: ar ? "مُفوَّضة" : "Authorized", value: authorized, icon: <ShieldCheck className="size-5" />, tone: "success" as const, href: "/fleet/vehicles?f_status=authorized" },
    { label: ar ? "في الصيانة" : "In Maintenance", value: maintenance, icon: <Wrench className="size-5" />, tone: "warning" as const, href: "/fleet/vehicles?f_status=maintenance" },
    { label: ar ? "حوادث مفتوحة" : "Open Accidents", value: openAccidents, icon: <AlertTriangle className="size-5" />, tone: "danger" as const, hint: `${totalAccidents} ${ar ? "إجمالي" : "total"}`, href: "/fleet/accidents" },
    { label: ar ? "تكلفة الحوادث المقدرة" : "Est. Accident Cost", value: formatCurrency(costAgg[0]?.est ?? 0, locale), tone: "warning" as const, href: "/fleet/accidents" },
  ];

  return (
    <>
      <PageHeader title={ar ? "لوحة المركبات" : "Vehicles Dashboard"} description={ar ? "الأسطول والتفويضات والحوادث" : "Fleet, authorizations & accidents"} />
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => <StatCard key={k.label} {...k} />)}
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card href="/fleet/vehicles" className="lg:col-span-2">
          <CardHeader title={ar ? "إضافات الأسطول — ١٢ شهرًا" : "Fleet additions — last 12 months"} />
          <CardBody><TrendChart data={authTrend} color="primary" /></CardBody>
        </Card>
        <Card href="/fleet/vehicles">
          <CardHeader title={ar ? "حسب النوع" : "By type"} />
          <CardBody><Donut data={typeData} centerLabel={ar ? "مركبة" : "vehicles"} /></CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card href="/fleet/vehicles">
          <CardHeader title={ar ? "حسب الحالة" : "By status"} />
          <CardBody>{statusData.length ? <Donut data={statusData} centerLabel={ar ? "مركبة" : "vehicles"} /> : <p className="text-sm text-fg-subtle">—</p>}</CardBody>
        </Card>
        <Card href="/fleet/vehicles">
          <CardHeader title={ar ? "حسب المدينة" : "By city"} />
          <CardBody><HBars data={byCity.map((r: { _id: string; n: number }) => ({ label: r._id || "—", value: r.n }))} color="info" /></CardBody>
        </Card>
        <Card href="/fleet/accidents">
          <CardHeader title={ar ? "الحوادث حسب الجسامة" : "Accidents by severity"} />
          <CardBody>{sevData.length ? <Donut data={sevData} centerLabel={ar ? "حادث" : "accidents"} /> : <p className="text-sm text-fg-subtle">{ar ? "لا توجد حوادث" : "No accidents"}</p>}</CardBody>
        </Card>
        <Card href="/fleet/vehicles">
          <CardHeader title={ar ? "حسب الإدارة" : "By department"} />
          <CardBody><HBars data={byDept.map((r: { name?: string; n: number }) => ({ label: r.name || "—", value: r.n }))} color="primary" /></CardBody>
        </Card>
      </div>
    </>
  );
}
