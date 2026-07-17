import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getLocale, getT } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Employee } from "@/models/Employee";
import { Leave } from "@/models/Leave";
import { EmployeeRequest } from "@/models/EmployeeRequest";
import { Custody } from "@/models/Custody";
import { License } from "@/models/License";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Donut } from "@/components/charts/Donut";
import { TrendChart } from "@/components/charts/TrendChart";
import { monthlySeries } from "@/lib/analytics";
import { Users, UserCheck, CalendarClock, Inbox, Package, FileWarning } from "lucide-react";
import { formatDate, daysUntil } from "@/lib/utils";

export const metadata: Metadata = { title: "HR Dashboard" };
export const dynamic = "force-dynamic";

export default async function HRDashboard() {
  await requirePermission("hr.dashboard:read");
  await connectDB();
  const [locale, t] = await Promise.all([getLocale(), getT()]);

  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 60);

  const [
    total,
    active,
    onLeave,
    suspended,
    terminated,
    pendingLeaves,
    openRequests,
    assignedCustody,
    byNationality,
    byProject,
    expiringDocs,
    expiredDocs,
    recentHires,
  ] = await Promise.all([
    Employee.countDocuments({}),
    Employee.countDocuments({ status: "active" }),
    Employee.countDocuments({ status: "on_leave" }),
    Employee.countDocuments({ status: "suspended" }),
    Employee.countDocuments({ status: "terminated" }),
    Leave.countDocuments({ status: "pending" }),
    EmployeeRequest.countDocuments({ status: { $in: ["open", "in_progress"] } }),
    Custody.countDocuments({ status: "assigned" }),
    Employee.aggregate([
      { $group: { _id: "$nationality", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    Employee.aggregate([
      { $match: { project: { $ne: null } } },
      { $group: { _id: "$project", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $lookup: { from: "projects", localField: "_id", foreignField: "_id", as: "p" } },
      { $project: { count: 1, name: { $first: "$p.nameAr" } } },
    ]),
    // Documents expiring within 60 days.
    Employee.aggregate([
      { $unwind: "$documents" },
      { $match: { "documents.expiryDate": { $gte: now, $lte: soon } } },
      { $count: "n" },
    ]),
    // Expired documents.
    Employee.aggregate([
      { $unwind: "$documents" },
      { $match: { "documents.expiryDate": { $lt: now } } },
      { $sort: { "documents.expiryDate": 1 } },
      {
        $project: {
          nameAr: 1,
          type: "$documents.type",
          expiryDate: "$documents.expiryDate",
        },
      },
      { $limit: 40 },
    ]),
    Employee.find({}).sort({ createdAt: -1 }).limit(8).select("nameAr createdAt hireDate").lean(),
  ]);

  const [hiringTrend, leavesByStatus] = await Promise.all([
    monthlySeries(Employee, "hireDate", 12, locale),
    Leave.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);

  const expiringCount = expiringDocs[0]?.n ?? 0;
  const lg = (k: string) => (leavesByStatus as { _id: string; n: number }[]).find((r) => r._id === k)?.n ?? 0;

  const statusDonut = [
    { label: locale === "ar" ? "على رأس العمل" : "Active", value: active, color: "success" },
    { label: locale === "ar" ? "في إجازة" : "On Leave", value: onLeave, color: "info" },
    { label: locale === "ar" ? "موقوف" : "Suspended", value: suspended, color: "warning" },
    { label: locale === "ar" ? "منتهية خدمته" : "Terminated", value: terminated, color: "danger" },
  ];
  const leavesDonut = [
    { label: locale === "ar" ? "قيد الموافقة" : "Pending", value: lg("pending"), color: "warning" },
    { label: locale === "ar" ? "موافق عليها" : "Approved", value: lg("approved"), color: "success" },
    { label: locale === "ar" ? "مرفوضة" : "Rejected", value: lg("rejected"), color: "danger" },
    { label: locale === "ar" ? "ملغاة" : "Cancelled", value: lg("cancelled"), color: "info" },
  ];

  const stats = [
    { label: t("hr.totalEmployees"), value: total, icon: <Users className="size-5" />, tone: "neutral" as const, href: "/hr/employees" },
    { label: t("hr.active"), value: active, icon: <UserCheck className="size-5" />, tone: "success" as const, href: "/hr/employees?f_status=active" },
    { label: t("hr.onLeave"), value: onLeave, icon: <CalendarClock className="size-5" />, tone: "info" as const, href: "/hr/employees?f_status=on_leave" },
    { label: t("hr.suspended"), value: suspended, tone: "warning" as const, href: "/hr/employees?f_status=suspended" },
    { label: t("hr.terminated"), value: terminated, tone: "danger" as const, href: "/hr/employees?f_status=terminated" },
    { label: t("hr.pendingLeaves"), value: pendingLeaves, icon: <CalendarClock className="size-5" />, tone: "warning" as const, href: "/hr/leaves?f_status=pending" },
    { label: t("hr.openRequests"), value: openRequests, icon: <Inbox className="size-5" />, tone: "info" as const, href: "/hr/requests" },
    { label: t("hr.assignedCustody"), value: assignedCustody, icon: <Package className="size-5" />, tone: "neutral" as const, href: "/hr/custody" },
    { label: t("hr.expiredDocs"), value: expiredDocs.length, icon: <FileWarning className="size-5" />, tone: "danger" as const, href: "/hr/employees" },
  ];

  return (
    <>
      <PageHeader title={t("hr.dashboard")} description={t("app.tagline")} />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Charts row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardHeader title={locale === "ar" ? "التعيينات — ١٢ شهرًا" : "Hiring — last 12 months"} />
          <CardBody><TrendChart data={hiringTrend} color="primary" /></CardBody>
        </Card>
        <Card>
          <CardHeader title={locale === "ar" ? "حسب الحالة" : "By status"} />
          <CardBody><Donut data={statusDonut} size={150} centerLabel={locale === "ar" ? "موظف" : "staff"} /></CardBody>
        </Card>
        <Card>
          <CardHeader title={t("hr.leaves")} />
          <CardBody><Donut data={leavesDonut} size={150} centerLabel={locale === "ar" ? "إجازة" : "leaves"} /></CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Expired documents */}
        <Card className="lg:col-span-2">
          <CardHeader
            title={t("hr.expiredDocs")}
            action={
              <Link href="/hr/employees" className="text-xs font-medium text-primary hover:underline">
                {t("common.view")}
              </Link>
            }
          />
          <div className="max-h-96 overflow-y-auto">
            {expiredDocs.length === 0 ? (
              <p className="p-6 text-sm text-fg-subtle">{t("common.noData")}</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {expiredDocs.map((d: { _id: string; nameAr: string; type: string; expiryDate: string }, i: number) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 text-fg">{d.nameAr}</td>
                      <td className="px-4 py-2.5 text-fg-muted capitalize">{String(d.type).replace("_", " ")}</td>
                      <td className="px-4 py-2.5 tabular text-fg-muted">{formatDate(d.expiryDate)}</td>
                      <td className="px-4 py-2.5 text-end">
                        <Badge tone="danger">{t("common.expired")}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          {/* By nationality */}
          <Card>
            <CardHeader title={t("hr.byNationality")} />
            <div className="p-4">
              {byNationality.map((n: { _id: string; count: number }) => (
                <BarRow key={n._id} label={n._id || "—"} value={n.count} max={total} />
              ))}
            </div>
          </Card>

          {/* By project */}
          <Card>
            <CardHeader title={t("hr.byProject")} />
            <div className="p-4">
              {byProject.length === 0 ? (
                <p className="text-sm text-fg-subtle">{t("common.noData")}</p>
              ) : (
                byProject.map((p: { _id: string; count: number; name?: string }) => (
                  <BarRow key={p._id} label={p.name || "—"} value={p.count} max={total} />
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent hires */}
      <Card className="mt-6">
        <CardHeader title={t("hr.recentHires")} />
        <div className="divide-y divide-border">
          {recentHires.map((e) => (
            <Link
              key={String(e._id)}
              href={`/hr/employees/${e._id}`}
              className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-surface-hover"
            >
              <span className="text-sm font-medium text-fg">{e.nameAr}</span>
              <span className="tabular text-xs text-fg-muted">
                {formatDate((e.hireDate as Date) ?? (e.createdAt as Date))}
              </span>
            </Link>
          ))}
        </div>
      </Card>
    </>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="truncate text-fg">{label}</span>
        <span className="tabular font-medium text-fg-muted">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-bg-subtle">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
