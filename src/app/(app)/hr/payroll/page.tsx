import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale, getT } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Employee } from "@/models/Employee";
import { Department } from "@/models/Department";
import { runListQuery } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import { serialize } from "@/lib/serialize";
import { payrollSpec } from "@/app/api/hr/payroll/export/route";
import { PayrollClient, type PayrollRow } from "./PayrollClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Payroll" };
export const dynamic = "force-dynamic";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requirePermission("hr.payroll:read");
  await connectDB();
  const [locale, t, sp] = await Promise.all([getLocale(), getT(), searchParams]);
  const query = parseListQuery(new URLSearchParams(sp));

  const [result, departments, totals] = await Promise.all([
    runListQuery(Employee, query, payrollSpec),
    Department.find({ isActive: true }).select("nameAr nameEn").lean(),
    Employee.aggregate([
      { $match: { status: { $ne: "terminated" } } },
      {
        $group: {
          _id: null,
          basic: { $sum: { $ifNull: ["$basicSalary", 0] } },
          housing: { $sum: { $ifNull: ["$housingAllowance", 0] } },
          transport: { $sum: { $ifNull: ["$transportAllowance", 0] } },
          other: { $sum: { $ifNull: ["$otherAllowance", 0] } },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const agg = totals[0] ?? { basic: 0, housing: 0, transport: 0, other: 0, count: 0 };

  return (
    <PayrollClient
      initial={serialize(result) as unknown as ListResult<PayrollRow>}
      locale={locale}
      title={t("hr.payroll")}
      departments={departments.map((d) => ({ value: String(d._id), label: locale === "ar" ? d.nameAr : d.nameEn ?? d.nameAr }))}
      totals={{ ...agg, grand: agg.basic + agg.housing + agg.transport + agg.other }}
    />
  );
}
