import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { FinanceTransaction } from "@/models/FinanceTransaction";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Donut } from "@/components/charts/Donut";
import { HBars } from "@/components/charts/Bars";
import { TrendChart } from "@/components/charts/TrendChart";
import { monthlySumSeries } from "@/lib/analytics";
import { TrendingUp, TrendingDown, Wallet, Scale } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Finance" };
export const dynamic = "force-dynamic";

export default async function FinanceDashboard() {
  await requirePermission("finance.dashboard:read");
  await connectDB();
  const locale = await getLocale();
  const ar = locale === "ar";
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [revenue, expense, revMtd, expMtd, byCategory, revTrend, expTrend] = await Promise.all([
    FinanceTransaction.aggregate([{ $match: { kind: "revenue", status: { $ne: "void" } } }, { $group: { _id: null, v: { $sum: "$amount" } } }]),
    FinanceTransaction.aggregate([{ $match: { kind: "expense", status: { $ne: "void" } } }, { $group: { _id: null, v: { $sum: "$amount" } } }]),
    FinanceTransaction.aggregate([{ $match: { kind: "revenue", date: { $gte: monthStart }, status: { $ne: "void" } } }, { $group: { _id: null, v: { $sum: "$amount" } } }]),
    FinanceTransaction.aggregate([{ $match: { kind: "expense", date: { $gte: monthStart }, status: { $ne: "void" } } }, { $group: { _id: null, v: { $sum: "$amount" } } }]),
    FinanceTransaction.aggregate([{ $match: { kind: "expense", status: { $ne: "void" } } }, { $group: { _id: "$category", v: { $sum: "$amount" } } }, { $sort: { v: -1 } }, { $limit: 6 }]),
    monthlySumSeries(FinanceTransaction, "date", "amount", 12, locale, { kind: "revenue", status: { $ne: "void" } }),
    monthlySumSeries(FinanceTransaction, "date", "amount", 12, locale, { kind: "expense", status: { $ne: "void" } }),
  ]);

  const totalRev = revenue[0]?.v ?? 0;
  const totalExp = expense[0]?.v ?? 0;
  const net = totalRev - totalExp;
  const netMtd = (revMtd[0]?.v ?? 0) - (expMtd[0]?.v ?? 0);

  const kpis = [
    { label: ar ? "إجمالي الإيرادات" : "Total Revenue", value: formatCurrency(totalRev, locale), icon: <TrendingUp className="size-5" />, tone: "success" as const, href: "/finance/transactions?f_kind=revenue" },
    { label: ar ? "إجمالي المصروفات" : "Total Expenses", value: formatCurrency(totalExp, locale), icon: <TrendingDown className="size-5" />, tone: "danger" as const, href: "/finance/transactions?f_kind=expense" },
    { label: ar ? "صافي الربح" : "Net Profit", value: formatCurrency(net, locale), icon: <Scale className="size-5" />, tone: net >= 0 ? ("success" as const) : ("danger" as const) },
    { label: ar ? "صافي الشهر" : "Net (MTD)", value: formatCurrency(netMtd, locale), icon: <Wallet className="size-5" />, tone: "accent" as const },
  ];

  // Merge revenue & expense trends into a comparison isn't supported by single-series chart;
  // show revenue trend + expense-by-category breakdown.
  return (
    <>
      <PageHeader title={ar ? "لوحة المالية" : "Finance Dashboard"} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} {...k} />)}
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card href="/finance/transactions?f_kind=revenue"><CardHeader title={ar ? "الإيرادات — ١٢ شهرًا" : "Revenue — 12 months"} /><CardBody><TrendChart data={revTrend} color="success" /></CardBody></Card>
        <Card href="/finance/transactions?f_kind=expense"><CardHeader title={ar ? "المصروفات — ١٢ شهرًا" : "Expenses — 12 months"} /><CardBody><TrendChart data={expTrend} color="danger" /></CardBody></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader title={ar ? "المصروفات حسب الفئة" : "Expenses by category"} /><CardBody><HBars data={byCategory.map((r: { _id: string; v: number }) => ({ label: r._id || "—", value: Math.round(r.v) }))} color="danger" unit={ar ? "ريال" : "SAR"} /></CardBody></Card>
        <Card><CardHeader title={ar ? "الإيراد مقابل المصروف" : "Revenue vs Expense"} /><CardBody>
          <Donut data={[{ label: ar ? "الإيرادات" : "Revenue", value: Math.round(totalRev), color: "success" }, { label: ar ? "المصروفات" : "Expenses", value: Math.round(totalExp), color: "danger" }]} centerLabel={ar ? "الصافي" : "Net"} centerValue={formatCurrency(net, locale).replace(/ (SAR|ريال)/, "")} />
        </CardBody></Card>
      </div>
    </>
  );
}
