import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { resolveLandingPage } from "@/lib/landing";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Employee } from "@/models/Employee";
import { Leave } from "@/models/Leave";
import { Vehicle } from "@/models/Vehicle";
import { Accident } from "@/models/Accident";
import { ThirdPartyAccount } from "@/models/ThirdPartyAccount";
import { Company } from "@/models/Company";
import { Deal } from "@/models/Deal";
import { PurchaseOrder } from "@/models/PurchaseOrder";
import { InventoryItem } from "@/models/InventoryItem";
import { PageHeader } from "@/components/PageHeader";
import { StatCard, MiniStat } from "@/components/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Donut } from "@/components/charts/Donut";
import { HBars } from "@/components/charts/Bars";
import { TrendChart } from "@/components/charts/TrendChart";
import { monthlySumSeries } from "@/lib/analytics";
import { statusLabel } from "@/lib/statusMeta";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Users, Truck, Boxes, Building2, ShoppingCart, ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Executive Overview" };
export const dynamic = "force-dynamic";

export default async function ExecutiveDashboard() {
  // /dashboard is the default post-login target, but only admins can see the
  // executive overview — send everyone else to their own landing page rather
  // than showing them a permission error.
  const user = await requireUser();
  if (!can(user.permissions, "exec.overview:read")) redirect(resolveLandingPage(user.permissions, user.role));
  await connectDB();
  const locale = await getLocale();
  const ar = locale === "ar";

  const [
    empTotal, empActive, empOnLeave, empByStatus, empByNationality, leavePending,
    vehTotal, vehAuthorized, vehByType, vehByStatus, vehByCity, openAccidents,
    accTotal, accActive, accByProject, ridersAssigned,
    companies, openDealsCount, dealByStage, pipelineByStage, wonTrend,
    poOpen, poValueAgg, invItems, lowStock,
  ] = await Promise.all([
    Employee.countDocuments({}),
    Employee.countDocuments({ status: "active" }),
    Employee.countDocuments({ status: "on_leave" }),
    Employee.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Employee.aggregate([{ $group: { _id: "$nationality", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 6 }]),
    Leave.countDocuments({ status: "pending" }),
    Vehicle.countDocuments({}),
    Vehicle.countDocuments({ status: "authorized" }),
    Vehicle.aggregate([{ $group: { _id: "$type", n: { $sum: 1 } } }]),
    Vehicle.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Vehicle.aggregate([{ $match: { city: { $ne: null } } }, { $group: { _id: "$city", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 6 }]),
    Accident.countDocuments({ status: { $ne: "closed" } }),
    ThirdPartyAccount.countDocuments({}),
    ThirdPartyAccount.countDocuments({ status: "active" }),
    ThirdPartyAccount.aggregate([{ $group: { _id: "$project", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 6 }, { $lookup: { from: "projects", localField: "_id", foreignField: "_id", as: "p" } }, { $project: { n: 1, name: { $first: "$p.nameAr" } } }]),
    ThirdPartyAccount.aggregate([{ $unwind: "$assignments" }, { $match: { "assignments.active": true } }, { $group: { _id: "$assignments.employee" } }, { $count: "n" }]),
    Company.countDocuments({}),
    Deal.countDocuments({ stage: { $nin: ["won", "lost"] } }),
    Deal.aggregate([{ $group: { _id: "$stage", n: { $sum: 1 } } }]),
    Deal.aggregate([{ $match: { stage: { $nin: ["won", "lost"] } } }, { $group: { _id: "$stage", v: { $sum: "$value" } } }]),
    monthlySumSeries(Deal, "closedDate", "value", 12, locale, { stage: "won" }),
    PurchaseOrder.countDocuments({ status: { $in: ["draft", "pending", "approved"] } }),
    PurchaseOrder.aggregate([{ $match: { status: { $ne: "cancelled" } } }, { $group: { _id: null, v: { $sum: "$total" } } }]),
    InventoryItem.countDocuments({}),
    InventoryItem.countDocuments({ $expr: { $lte: ["$quantity", "$reorderLevel"] } }),
  ]);

  const g = (rows: { _id: string; n: number }[], k: string) => rows.find((r) => r._id === k)?.n ?? 0;
  const gv = (rows: { _id: string; v: number }[], k: string) => rows.find((r) => r._id === k)?.v ?? 0;
  const pipelineTotal = pipelineByStage.reduce((s: number, r: { v: number }) => s + r.v, 0);

  const empStatusData = [
    { label: ar ? "على رأس العمل" : "Active", value: g(empByStatus, "active"), color: "success" },
    { label: ar ? "في إجازة" : "On Leave", value: g(empByStatus, "on_leave"), color: "info" },
    { label: ar ? "موقوف" : "Suspended", value: g(empByStatus, "suspended"), color: "warning" },
    { label: ar ? "منتهية خدمته" : "Terminated", value: g(empByStatus, "terminated"), color: "danger" },
  ];
  const vehTypeData = [
    { label: ar ? "سيارة" : "Car", value: g(vehByType, "car"), color: "primary" },
    { label: ar ? "دراجة آلية" : "Motorcycle", value: g(vehByType, "motorcycle"), color: "accent" },
    { label: ar ? "شاحنة ثقيلة" : "Heavy Truck", value: g(vehByType, "heavy_truck"), color: "info" },
  ];
  const STATUS_COLOR: Record<string, string> = { authorized: "success", available: "info", parked: "info", maintenance: "warning", no_plate: "warning", impounded: "danger", withdrawn: "info", stolen: "danger", out_of_service: "danger" };
  const vehStatusData = vehByStatus.map((r: { _id: string; n: number }) => ({ label: statusLabel("vehicle", r._id, locale), value: r.n, color: STATUS_COLOR[r._id] ?? "primary" }));
  const STAGE_LABEL: Record<string, [string, string]> = { lead: ["عميل محتمل", "Lead"], qualified: ["مؤهّل", "Qualified"], proposal: ["عرض سعر", "Proposal"], negotiation: ["تفاوض", "Negotiation"], won: ["مكسوبة", "Won"], lost: ["خاسرة", "Lost"] };
  const STAGE_COLOR: Record<string, string> = { lead: "info", qualified: "info", proposal: "warning", negotiation: "accent", won: "success", lost: "danger" };
  const dealStageData = dealByStage.filter((r: { _id: string; n: number }) => r.n > 0).map((r: { _id: string; n: number }) => ({ label: STAGE_LABEL[r._id]?.[ar ? 0 : 1] ?? r._id, value: r.n, color: STAGE_COLOR[r._id] ?? "primary" }));
  const pipelineBars = ["lead", "qualified", "proposal", "negotiation"].map((s) => ({ label: STAGE_LABEL[s][ar ? 0 : 1], value: Math.round(gv(pipelineByStage, s)) }));

  return (
    <>
      <PageHeader title={ar ? "النظرة التنفيذية" : "Executive Overview"} description={ar ? "كل قسم، كل رقم — مباشر" : "Every section, every number — live"} />

      {/* Headline KPI strip */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label={ar ? "الموظفون" : "Employees"} value={formatNumber(empTotal)} hint={`${empActive} ${ar ? "نشط" : "active"}`} icon={<Users className="size-5" />} href="/hr/employees" />
        <StatCard label={ar ? "المركبات" : "Vehicles"} value={formatNumber(vehTotal)} hint={`${vehAuthorized} ${ar ? "مُفوَّضة" : "authorized"}`} icon={<Truck className="size-5" />} tone="info" href="/fleet/vehicles" />
        <StatCard label={ar ? "حسابات المشاريع" : "Accounts"} value={formatNumber(accTotal)} hint={`${accActive} ${ar ? "نشط" : "active"}`} icon={<Boxes className="size-5" />} tone="accent" href="/ops/accounts" />
        <StatCard label={ar ? "الشركات" : "Companies"} value={formatNumber(companies)} hint={`${openDealsCount} ${ar ? "صفقة" : "deals"}`} icon={<Building2 className="size-5" />} href="/crm/companies" />
        <StatCard label={ar ? "خط الأنابيب" : "Pipeline"} value={formatCurrency(pipelineTotal, locale)} tone="success" href="/crm/deals" />
        <StatCard label={ar ? "قيمة المشتريات" : "PO Value"} value={formatCurrency(poValueAgg[0]?.v ?? 0, locale)} tone="warning" hint={`${poOpen} ${ar ? "مفتوح" : "open"}`} icon={<ShoppingCart className="size-5" />} href="/procurement/orders" />
      </div>

      {/* HR section */}
      <Section title={ar ? "الموارد البشرية" : "Human Resources"} href="/hr" icon={<Users className="size-4" />} locale={locale}>
        <MiniStat label={ar ? "إجمالي الموظفين" : "Total"} value={empTotal} href="/hr/employees" />
        <MiniStat label={ar ? "نشط" : "Active"} value={empActive} tone="success" href="/hr/employees?f_status=active" />
        <MiniStat label={ar ? "في إجازة" : "On Leave"} value={empOnLeave} tone="info" href="/hr/employees?f_status=on_leave" />
        <MiniStat label={ar ? "إجازات معلّقة" : "Pending Leaves"} value={leavePending} tone="warning" href="/hr/leaves?f_status=pending" />
      </Section>
      <div className="mb-8 grid gap-5 lg:grid-cols-2">
        <Card href="/hr/employees"><CardHeader title={ar ? "الموظفون حسب الحالة" : "Employees by status"} /><CardBody><Donut data={empStatusData} centerLabel={ar ? "موظف" : "staff"} /></CardBody></Card>
        <Card href="/hr/employees"><CardHeader title={ar ? "حسب الجنسية" : "By nationality"} /><CardBody><HBars data={empByNationality.map((r: { _id: string; n: number }) => ({ label: r._id || "—", value: r.n }))} color="primary" /></CardBody></Card>
      </div>

      {/* Fleet section */}
      <Section title={ar ? "المركبات والتفويضات" : "Vehicles & Authorizations"} href="/fleet" icon={<Truck className="size-4" />} locale={locale}>
        <MiniStat label={ar ? "إجمالي المركبات" : "Total"} value={vehTotal} href="/fleet/vehicles" />
        <MiniStat label={ar ? "مُفوَّضة" : "Authorized"} value={vehAuthorized} tone="success" href="/fleet/vehicles?f_status=authorized" />
        <MiniStat label={ar ? "غير مسلّمة" : "Unassigned"} value={vehTotal - vehAuthorized} tone="warning" href="/fleet/vehicles?f_status=available" />
        <MiniStat label={ar ? "حوادث مفتوحة" : "Open Accidents"} value={openAccidents} tone="danger" href="/fleet/accidents" />
      </Section>
      <div className="mb-8 grid gap-5 lg:grid-cols-3">
        <Card href="/fleet/vehicles"><CardHeader title={ar ? "حسب النوع" : "By type"} /><CardBody><Donut data={vehTypeData} centerLabel={ar ? "مركبة" : "vehicles"} /></CardBody></Card>
        <Card href="/fleet/vehicles"><CardHeader title={ar ? "حسب الحالة" : "By status"} /><CardBody><Donut data={vehStatusData} centerLabel={ar ? "مركبة" : "vehicles"} /></CardBody></Card>
        <Card href="/fleet/vehicles"><CardHeader title={ar ? "حسب المدينة" : "By city"} /><CardBody><HBars data={vehByCity.map((r: { _id: string; n: number }) => ({ label: r._id || "—", value: r.n }))} color="info" /></CardBody></Card>
      </div>

      {/* Operations section */}
      <Section title={ar ? "العمليات" : "Operations"} href="/ops" icon={<Boxes className="size-4" />} locale={locale}>
        <MiniStat label={ar ? "إجمالي الحسابات" : "Accounts"} value={accTotal} href="/ops/accounts" />
        <MiniStat label={ar ? "نشطة" : "Active"} value={accActive} tone="success" href="/ops/accounts?f_status=active" />
        <MiniStat label={ar ? "مناديب مسلَّم لهم" : "Riders Assigned"} value={ridersAssigned[0]?.n ?? 0} tone="accent" href="/hr/employees?f_isDriver=true" />
        <MiniStat label={ar ? "المشاريع" : "Projects"} value={accByProject.length} tone="info" href="/ops/projects" />
      </Section>
      <div className="mb-8">
        <Card href="/ops/accounts"><CardHeader title={ar ? "الحسابات حسب المشروع" : "Accounts by project"} action={<OpenLink href="/ops/accounts" locale={locale} />} /><CardBody><HBars data={accByProject.map((r: { name?: string; n: number }) => ({ label: r.name || "—", value: r.n }))} color="accent" /></CardBody></Card>
      </div>

      {/* Commercial section (CRM + Sales) */}
      <Section title={ar ? "المبيعات وعلاقات العملاء" : "Sales & CRM"} href="/crm" icon={<Building2 className="size-4" />} locale={locale}>
        <MiniStat label={ar ? "الشركات" : "Companies"} value={companies} href="/crm/companies" />
        <MiniStat label={ar ? "صفقات مفتوحة" : "Open Deals"} value={openDealsCount} tone="info" href="/crm/deals" />
        <MiniStat label={ar ? "خط الأنابيب" : "Pipeline"} value={formatCurrency(pipelineTotal, locale)} tone="accent" href="/crm/deals" />
        <MiniStat label={ar ? "صفقات مكسوبة" : "Won"} value={g(dealByStage, "won")} tone="success" href="/crm/deals?f_stage=won" />
      </Section>
      <div className="mb-8 grid gap-5 lg:grid-cols-3">
        <Card href="/sales" className="lg:col-span-2"><CardHeader title={ar ? "قيمة الصفقات المكسوبة — ١٢ شهرًا" : "Won value — 12 months"} /><CardBody><TrendChart data={wonTrend} color="success" /></CardBody></Card>
        <Card href="/crm/deals"><CardHeader title={ar ? "الصفقات حسب المرحلة" : "Deals by stage"} /><CardBody>{dealStageData.length ? <Donut data={dealStageData} centerLabel={ar ? "صفقة" : "deals"} /> : <Empty ar={ar} />}</CardBody></Card>
      </div>

      {/* Procurement section */}
      <Section title={ar ? "المشتريات والمخازن" : "Procurement & Warehouse"} href="/procurement" icon={<ShoppingCart className="size-4" />} locale={locale}>
        <MiniStat label={ar ? "أوامر مفتوحة" : "Open POs"} value={poOpen} tone="info" href="/procurement/orders" />
        <MiniStat label={ar ? "قيمة الأوامر" : "PO Value"} value={formatCurrency(poValueAgg[0]?.v ?? 0, locale)} href="/procurement/orders" />
        <MiniStat label={ar ? "أصناف المخزون" : "Inventory Items"} value={invItems} href="/procurement/inventory" />
        <MiniStat label={ar ? "مخزون منخفض" : "Low Stock"} value={lowStock} tone="warning" href="/procurement/inventory" />
      </Section>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card href="/crm/deals"><CardHeader title={ar ? "خط الأنابيب حسب المرحلة" : "Pipeline by stage"} /><CardBody><HBars data={pipelineBars} color="primary" /></CardBody></Card>
        <Card href="/procurement/orders"><CardHeader title={ar ? "قيمة الأوامر" : "PO value"} action={<OpenLink href="/procurement/orders" locale={locale} />} /><CardBody className="flex h-full items-center justify-center"><div className="text-center"><p className="text-4xl font-bold tabular text-fg">{formatCurrency(poValueAgg[0]?.v ?? 0, locale)}</p><p className="mt-1 text-sm text-fg-muted">{poOpen} {ar ? "أمر شراء مفتوح" : "open purchase orders"}</p></div></CardBody></Card>
      </div>
    </>
  );
}

function Section({ title, href, icon, locale, children }: { title: string; href: string; icon: React.ReactNode; locale: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 mt-2">
      <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
          {title}
        </h2>
        <OpenLink href={href} locale={locale} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>
    </div>
  );
}

function OpenLink({ href, locale }: { href: string; locale: string }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
      {locale === "ar" ? "فتح القسم" : "Open"}
      <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
    </Link>
  );
}

function Empty({ ar }: { ar: boolean }) {
  return <p className="text-sm text-fg-subtle">{ar ? "لا توجد بيانات" : "No data"}</p>;
}
