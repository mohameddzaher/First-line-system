import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale, getT } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Employee } from "@/models/Employee";
import { Department } from "@/models/Department";
import { Project } from "@/models/Project";
import { runListQuery } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import { serialize } from "@/lib/serialize";
import { statusOptions } from "@/lib/statusMeta";
import { employeeListSpec } from "@/app/api/hr/employees/shared";
import { EmployeesClient, type EmployeeRow } from "./EmployeesClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Employees" };
export const dynamic = "force-dynamic";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requirePermission("hr.employees:read");
  await connectDB();

  const [locale, t, sp] = await Promise.all([getLocale(), getT(), searchParams]);
  const query = parseListQuery(new URLSearchParams(sp));

  const [result, departments, projects, nationalities] = await Promise.all([
    runListQuery(Employee, query, employeeListSpec),
    Department.find({ isActive: true }).select("nameAr nameEn").lean(),
    Project.find({ isActive: true }).select("nameAr nameEn").lean(),
    Employee.distinct("nationality"),
  ]);

  return (
    <EmployeesClient
      initial={serialize(result) as unknown as ListResult<EmployeeRow>}
      title={t("hr.employees")}
      statusFilterOptions={statusOptions("employee", locale)}
      departmentOptions={departments.map((d) => ({
        value: String(d._id),
        label: locale === "ar" ? d.nameAr : d.nameEn ?? d.nameAr,
      }))}
      projectOptions={projects.map((p) => ({
        value: String(p._id),
        label: locale === "ar" ? p.nameAr : p.nameEn ?? p.nameAr,
      }))}
      nationalityOptions={(nationalities as string[])
        .filter(Boolean)
        .sort()
        .map((n) => ({ value: n, label: n }))}
    />
  );
}
