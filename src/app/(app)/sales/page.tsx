import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Deal } from "@/models/Deal";
import { SalesTarget } from "@/models/SalesTarget";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Gauge } from "@/components/charts/Gauge";
import { TrendChart } from "@/components/charts/TrendChart";
import { HBars } from "@/components/charts/Bars";
import { Donut } from "@/components/charts/Donut";
import { monthlySumSeries } from "@/lib/analytics";
import { Trophy, Target, TrendingUp, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Sales" };
export const dynamic = "force-dynamic";

export default async function SalesDashboard() {
  await requirePermission("sales.dashboard:read");
  await connectDB();
  const locale = await getLocale();
  const ar = locale === "ar";

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [wonMtd, wonAll, openPipeline, avgDeal, targets, winCount, lostCount, wonTrend, byOwner, byStageValue] = await Promise.all([
    Deal.aggregate([{ $match: { stage: "won", closedDate: { $gte: monthStart } } }, { $group: { _id: null, v: { $sum: "$value" } } }]),
    Deal.aggregate([{ $match: { stage: "won" } }, { $group: { _id: null, v: { $sum: "$value" } } }]),
    Deal.aggregate([{ $match: { stage: { $nin: ["won", "lost"] } } }, { $group: { _id: null, v: { $sum: "$value" } } }]),
    Deal.aggregate([{ $match: { stage: "won" } }, { $group: { _id: null, v: { $avg: "$value" } } }]),
    SalesTarget.aggregate([{ $group: { _id: null, v: { $sum: "$targetAmount" } } }]),
    Deal.countDocuments({ stage: "won" }),
    Deal.countDocuments({ stage: "lost" }),
    monthlySumSeries(Deal, "closedDate", "value", 12, locale, { stage: "won" }),
    Deal.aggregate([{ $match: { stage: "won", owner: { $ne: null } } }, { $group: { _id: "$owner", v: { $sum: "$value" } } }, { $sort: { v: -1 } }, { $limit: 6 }, { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "u" } }, { $project: { v: 1, name: { $concat: [{ $first: "$u.firstName" }, " ", { $first: "$u.lastName" }] } } }]),
    Deal.aggregate([{ $match: { stage: { $nin: ["won", "lost"] } } }, { $group: { _id: "$stage", v: { $sum: "$value" } } }]),
  ]);

  const wonValue = wonMtd[0]?.v ?? 0;
  const target = targets[0]?.v ?? 0;
  const attainment = target > 0 ? Math.round((wonValue / target) * 100) : 0;
  const winRate = winCount + lostCount > 0 ? Math.round((winCount / (winCount + lostCount)) * 100) : 0;

  const STAGE_LABEL: Record<string, [string, string]> = { lead: ["عميل محتمل", "Lead"], qualified: ["مؤهّل", "Qualified"], proposal: ["عرض سعر", "Proposal"], negotiation: ["تفاوض", "Negotiation"] };
  const stageValueData = byStageValue.map((r: { _id: string; v: number }) => ({ label: STAGE_LABEL[r._id]?.[ar ? 0 : 1] ?? r._id, value: Math.round(r.v) }));

  const kpis = [
    { label: ar ? "مكسوب (هذا الشهر)" : "Won (MTD)", value: formatCurrency(wonValue, locale), icon: <Trophy className="size-5" />, tone: "success" as const, href: "/crm/deals?f_stage=won" },
    { label: ar ? "المستهدف" : "Target", value: formatCurrency(target, locale), icon: <Target className="size-5" />, tone: "neutral" as const, href: "/sales/targets" },
    { label: ar ? "خط الأنابيب المفتوح" : "Open Pipeline", value: formatCurrency(openPipeline[0]?.v ?? 0, locale), icon: <Wallet className="size-5" />, tone: "accent" as const, href: "/crm/deals" },
    { label: ar ? "معدل الفوز" : "Win Rate", value: `${winRate}%`, icon: <TrendingUp className="size-5" />, tone: "info" as const, href: "/crm/deals" },
  ];

  return (
    <>
      <PageHeader title={ar ? "لوحة المبيعات" : "Sales Dashboard"} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} {...k} />)}
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title={ar ? "تحقيق المستهدف (الشهر)" : "Target attainment (MTD)"} />
          <CardBody className="flex flex-col items-center">
            <Gauge value={attainment} label={ar ? "من المستهدف" : "of target"} color={attainment >= 100 ? "success" : "primary"} />
            <p className="mt-3 text-sm text-fg-muted">{formatCurrency(wonValue, locale)} / {formatCurrency(target, locale)}</p>
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title={ar ? "المبيعات المكسوبة — ١٢ شهرًا" : "Won sales — last 12 months"} />
          <CardBody><TrendChart data={wonTrend} color="success" /></CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={ar ? "أفضل المندوبين (مبيعات مكسوبة)" : "Top reps (won value)"} />
          <CardBody><HBars data={byOwner.map((r: { name?: string; v: number }) => ({ label: r.name || "—", value: Math.round(r.v) }))} color="primary" unit={ar ? "ريال" : "SAR"} /></CardBody>
        </Card>
        <Card>
          <CardHeader title={ar ? "خط الأنابيب حسب المرحلة" : "Pipeline by stage"} />
          <CardBody>{stageValueData.length ? <Donut data={stageValueData.map((d, i) => ({ ...d, color: ["info", "warning", "accent", "primary"][i % 4] }))} centerValue={formatCurrency(openPipeline[0]?.v ?? 0, locale).replace(/ (SAR|ريال)/, "")} centerLabel={ar ? "ريال" : "SAR"} /> : <p className="text-sm text-fg-subtle">—</p>}</CardBody>
        </Card>
      </div>
    </>
  );
}
