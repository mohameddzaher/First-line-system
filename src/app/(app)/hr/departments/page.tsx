import type { Metadata } from "next";
import { Types } from "mongoose";
import { Department } from "@/models/Department";
import { Employee } from "@/models/Employee";
import { Vehicle } from "@/models/Vehicle";
import { loadList } from "@/lib/loadList";
import { departmentSpec } from "@/app/api/hr/departments/route";
import { getT } from "@/i18n/server";
import { DepartmentsClient } from "./DepartmentsClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Departments" };
export const dynamic = "force-dynamic";

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const { result, locale } = await loadList(Department, "hr.departments:read", departmentSpec, sp);
  const t = await getT();

  // A department is only meaningful in terms of what hangs off it, so the list
  // carries live headcount and fleet counts rather than names alone.
  const ids = (result.rows as { _id: string }[]).map((r) => r._id);
  // Aggregation pipelines bypass schema casting, so the ids must be real
  // ObjectIds here — passing the strings straight through matches nothing.
  const objectIds = ids.map((id) => new Types.ObjectId(id));
  const [staff, fleet] = await Promise.all([
    Employee.aggregate<{ _id: unknown; count: number }>([
      { $match: { department: { $in: objectIds }, status: { $ne: "terminated" } } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]),
    Vehicle.aggregate<{ _id: unknown; count: number }>([
      { $match: { department: { $in: objectIds } } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]),
  ]);

  const counts: Record<string, { staff: number; vehicles: number }> = {};
  for (const id of ids) counts[id] = { staff: 0, vehicles: 0 };
  for (const row of staff) if (counts[String(row._id)]) counts[String(row._id)].staff = row.count;
  for (const row of fleet) if (counts[String(row._id)]) counts[String(row._id)].vehicles = row.count;

  return (
    <DepartmentsClient
      initial={result as unknown as ListResult<DepartmentRow>}
      locale={locale}
      title={t("hr.departments")}
      counts={counts}
    />
  );
}

export interface DepartmentRow {
  _id: string;
  nameAr: string;
  nameEn?: string;
  code?: string;
  isActive: boolean;
}
