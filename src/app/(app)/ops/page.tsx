import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { ThirdPartyAccount } from "@/models/ThirdPartyAccount";
import { Project } from "@/models/Project";
import { Employee } from "@/models/Employee";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Donut } from "@/components/charts/Donut";
import { HBars } from "@/components/charts/Bars";
import { Boxes, FolderKanban, Bike, UserCheck } from "lucide-react";

export const metadata: Metadata = { title: "Operations" };
export const dynamic = "force-dynamic";

export default async function OpsDashboard() {
  await requirePermission("ops.dashboard:read");
  await connectDB();
  const locale = await getLocale();
  const ar = locale === "ar";

  const [totalAccounts, projects, drivers, byStatus, byProject, assignedRiders, byShift, riderLoad] = await Promise.all([
    ThirdPartyAccount.countDocuments({}),
    Project.countDocuments({ isActive: true }),
    Employee.countDocuments({ isDriver: true, status: { $ne: "terminated" } }),
    ThirdPartyAccount.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    ThirdPartyAccount.aggregate([{ $group: { _id: "$project", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 8 }, { $lookup: { from: "projects", localField: "_id", foreignField: "_id", as: "p" } }, { $project: { n: 1, name: { $first: "$p.nameAr" } } }]),
    ThirdPartyAccount.aggregate([{ $unwind: "$assignments" }, { $match: { "assignments.active": true } }, { $group: { _id: "$assignments.employee" } }, { $count: "n" }]),
    ThirdPartyAccount.aggregate([{ $unwind: "$assignments" }, { $match: { "assignments.active": true } }, { $group: { _id: "$assignments.shift", n: { $sum: 1 } } }]),
    ThirdPartyAccount.aggregate([{ $unwind: "$assignments" }, { $match: { "assignments.active": true } }, { $group: { _id: "$project", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 8 }, { $lookup: { from: "projects", localField: "_id", foreignField: "_id", as: "p" } }, { $project: { n: 1, name: { $first: "$p.nameAr" } } }]),
  ]);

  const g = (rows: { _id: string; n: number }[], k: string) => rows.find((r) => r._id === k)?.n ?? 0;
  const statusData = [
    { label: ar ? "نشط" : "Active", value: g(byStatus, "active"), color: "success" },
    { label: ar ? "خامل" : "Idle", value: g(byStatus, "idle"), color: "info" },
    { label: ar ? "موقوف" : "Suspended", value: g(byStatus, "suspended"), color: "warning" },
    { label: ar ? "مغلق" : "Closed", value: g(byStatus, "closed"), color: "danger" },
  ];
  const SHIFT: Record<string, [string, string, string]> = { full: ["كامل", "Full", "primary"], morning: ["صباحي", "Morning", "info"], evening: ["مسائي", "Evening", "warning"], night: ["ليلي", "Night", "accent"] };
  const shiftData = byShift.map((r: { _id: string; n: number }) => ({ label: SHIFT[r._id]?.[ar ? 0 : 1] ?? r._id, value: r.n, color: SHIFT[r._id]?.[2] ?? "primary" }));

  const kpis = [
    { label: ar ? "إجمالي الحسابات" : "Total Accounts", value: totalAccounts, icon: <Boxes className="size-5" />, tone: "neutral" as const, href: "/ops/accounts" },
    { label: ar ? "حسابات نشطة" : "Active Accounts", value: g(byStatus, "active"), icon: <UserCheck className="size-5" />, tone: "success" as const, href: "/ops/accounts?f_status=active" },
    { label: ar ? "المشاريع" : "Projects", value: projects, icon: <FolderKanban className="size-5" />, tone: "info" as const, href: "/ops/projects" },
    { label: ar ? "المناديب" : "Riders", value: drivers, icon: <Bike className="size-5" />, tone: "neutral" as const, href: "/hr/employees?f_isDriver=true" },
    { label: ar ? "مناديب مسلَّم لهم" : "Assigned Riders", value: assignedRiders[0]?.n ?? 0, tone: "accent" as const, href: "/ops/accounts" },
  ];

  return (
    <>
      <PageHeader title={ar ? "لوحة العمليات" : "Operations Dashboard"} />
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => <StatCard key={k.label} {...k} />)}
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={ar ? "الحسابات حسب المشروع" : "Accounts by project"} />
          <CardBody><HBars data={byProject.map((r: { name?: string; n: number }) => ({ label: r.name || "—", value: r.n }))} color="primary" /></CardBody>
        </Card>
        <Card>
          <CardHeader title={ar ? "الحسابات حسب الحالة" : "Accounts by status"} />
          <CardBody><Donut data={statusData} centerLabel={ar ? "حساب" : "accounts"} /></CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={ar ? "التسليمات النشطة حسب الوردية" : "Active assignments by shift"} />
          <CardBody>{shiftData.length ? <Donut data={shiftData} centerLabel={ar ? "تسليم" : "assign."} /> : <p className="text-sm text-fg-subtle">—</p>}</CardBody>
        </Card>
        <Card>
          <CardHeader title={ar ? "المناديب النشطون حسب المشروع" : "Active riders by project"} />
          <CardBody><HBars data={riderLoad.map((r: { name?: string; n: number }) => ({ label: r.name || "—", value: r.n }))} color="accent" /></CardBody>
        </Card>
      </div>
    </>
  );
}
