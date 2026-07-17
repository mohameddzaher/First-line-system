import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Company } from "@/models/Company";
import { Contact } from "@/models/Contact";
import { Deal } from "@/models/Deal";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Donut } from "@/components/charts/Donut";
import { HBars } from "@/components/charts/Bars";
import { TrendChart } from "@/components/charts/TrendChart";
import { monthlySumSeries } from "@/lib/analytics";
import { Building2, Users, Handshake, Trophy, Wallet, Percent } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "CRM" };
export const dynamic = "force-dynamic";

const STAGE_ORDER = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
const STAGE_LABEL: Record<string, [string, string]> = { lead: ["عميل محتمل", "Lead"], qualified: ["مؤهّل", "Qualified"], proposal: ["عرض سعر", "Proposal"], negotiation: ["تفاوض", "Negotiation"], won: ["مكسوبة", "Won"], lost: ["خاسرة", "Lost"] };
const STAGE_COLOR: Record<string, string> = { lead: "info", qualified: "info", proposal: "warning", negotiation: "warning", won: "success", lost: "danger" };

export default async function CRMDashboard() {
  await requirePermission("crm.dashboard:read");
  await connectDB();
  const locale = await getLocale();
  const ar = locale === "ar";

  const [companies, contacts, openDeals, pipeline, won, lost, byStage, valueByStage, byKind, byCity, wonTrend, topDeals] =
    await Promise.all([
      Company.countDocuments({}),
      Contact.countDocuments({}),
      Deal.countDocuments({ stage: { $nin: ["won", "lost"] } }),
      Deal.aggregate([{ $match: { stage: { $nin: ["won", "lost"] } } }, { $group: { _id: null, v: { $sum: "$value" } } }]),
      Deal.countDocuments({ stage: "won" }),
      Deal.countDocuments({ stage: "lost" }),
      Deal.aggregate([{ $group: { _id: "$stage", n: { $sum: 1 } } }]),
      Deal.aggregate([{ $group: { _id: "$stage", v: { $sum: "$value" } } }]),
      Company.aggregate([{ $group: { _id: "$kind", n: { $sum: 1 } } }]),
      Company.aggregate([{ $match: { city: { $ne: null } } }, { $group: { _id: "$city", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 6 }]),
      monthlySumSeries(Deal, "closedDate", "value", 12, locale, { stage: "won" }),
      Deal.find({ stage: { $nin: ["won", "lost"] } }).populate("company", "name nameAr").sort({ value: -1 }).limit(6).lean(),
    ]);

  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;
  const g = (rows: { _id: string; n: number }[], k: string) => rows.find((r) => r._id === k)?.n ?? 0;
  const gv = (rows: { _id: string; v: number }[], k: string) => rows.find((r) => r._id === k)?.v ?? 0;

  const stageData = STAGE_ORDER.filter((s) => g(byStage, s) > 0).map((s) => ({ label: STAGE_LABEL[s][ar ? 0 : 1], value: g(byStage, s), color: STAGE_COLOR[s] }));
  const funnelData = ["lead", "qualified", "proposal", "negotiation", "won"].map((s) => ({ label: STAGE_LABEL[s][ar ? 0 : 1], value: gv(valueByStage, s) }));
  const kindData = [
    { label: ar ? "عملاء" : "Customers", value: g(byKind, "customer"), color: "info" },
    { label: ar ? "موردون" : "Vendors", value: g(byKind, "vendor"), color: "accent" },
    { label: ar ? "كلاهما" : "Both", value: g(byKind, "both"), color: "success" },
  ];

  const kpis = [
    { label: ar ? "الشركات" : "Companies", value: companies, icon: <Building2 className="size-5" />, tone: "neutral" as const, href: "/crm/companies" },
    { label: ar ? "جهات الاتصال" : "Contacts", value: contacts, icon: <Users className="size-5" />, tone: "neutral" as const, href: "/crm/contacts" },
    { label: ar ? "صفقات مفتوحة" : "Open Deals", value: openDeals, icon: <Handshake className="size-5" />, tone: "info" as const, href: "/crm/deals" },
    { label: ar ? "قيمة خط الأنابيب" : "Pipeline Value", value: formatCurrency(pipeline[0]?.v ?? 0, locale), icon: <Wallet className="size-5" />, tone: "accent" as const, href: "/crm/deals" },
    { label: ar ? "صفقات مكسوبة" : "Won", value: won, icon: <Trophy className="size-5" />, tone: "success" as const, href: "/crm/deals?f_stage=won" },
    { label: ar ? "معدل الفوز" : "Win Rate", value: `${winRate}%`, icon: <Percent className="size-5" />, tone: "success" as const, href: "/crm/deals" },
  ];

  return (
    <>
      <PageHeader title={ar ? "لوحة علاقات العملاء" : "CRM Dashboard"} />
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => <StatCard key={k.label} {...k} />)}
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={ar ? "قيمة الصفقات المكسوبة — ١٢ شهرًا" : "Won deal value — last 12 months"} />
          <CardBody><TrendChart data={wonTrend} color="success" /></CardBody>
        </Card>
        <Card>
          <CardHeader title={ar ? "الصفقات حسب المرحلة" : "Deals by stage"} />
          <CardBody>{stageData.length ? <Donut data={stageData} centerLabel={ar ? "صفقة" : "deals"} /> : <p className="text-sm text-fg-subtle">—</p>}</CardBody>
        </Card>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={ar ? "قيمة خط الأنابيب حسب المرحلة" : "Pipeline value by stage"} />
          <CardBody><HBars data={funnelData} color="primary" /></CardBody>
        </Card>
        <Card>
          <CardHeader title={ar ? "الشركات حسب النوع" : "Companies by type"} />
          <CardBody><Donut data={kindData} centerLabel={ar ? "شركة" : "cos"} /></CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title={ar ? "حسب المدينة" : "By City"} />
          <CardBody><HBars data={byCity.map((r: { _id: string; n: number }) => ({ label: r._id || "—", value: r.n }))} color="info" /></CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title={ar ? "أكبر الصفقات المفتوحة" : "Top open deals"} />
          <div className="divide-y divide-border">
            {topDeals.length === 0 && <p className="p-5 text-sm text-fg-subtle">—</p>}
            {(topDeals as unknown as { _id: string; title: string; value: number; company?: { name?: string } }[]).map((d) => (
              <div key={String(d._id)} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">{d.title}</p>
                  <p className="truncate text-xs text-fg-muted">{d.company?.name ?? "—"}</p>
                </div>
                <span className="tabular text-sm font-semibold text-fg">{formatCurrency(d.value, locale)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
