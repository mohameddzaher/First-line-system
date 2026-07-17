import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale, getT } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Vehicle } from "@/models/Vehicle";
import { Department } from "@/models/Department";
import { runListQuery } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import { serialize } from "@/lib/serialize";
import { vehicleSpec } from "@/app/api/fleet/vehicles/route";
import { employeeOptions } from "@/lib/pickerOptions";
import { VehiclesClient, type VehicleRow } from "./VehiclesClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Fleet & Authorizations" };
export const dynamic = "force-dynamic";

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requirePermission("fleet.vehicles:read");
  await connectDB();
  const [locale, t, sp] = await Promise.all([getLocale(), getT(), searchParams]);
  const query = parseListQuery(new URLSearchParams(sp));

  const [result, departments, employees, cities] = await Promise.all([
    runListQuery(Vehicle, query, vehicleSpec),
    Department.find({ isActive: true }).select("nameAr nameEn").lean(),
    employeeOptions(),
    Vehicle.distinct("city"),
  ]);

  return (
    <VehiclesClient
      initial={serialize(result) as unknown as ListResult<VehicleRow>}
      locale={locale}
      title={t("fleet.vehicles")}
      employees={employees}
      departments={departments.map((d) => ({ value: String(d._id), label: locale === "ar" ? d.nameAr : d.nameEn ?? d.nameAr }))}
      cities={(cities as string[]).filter(Boolean).sort().map((c) => ({ value: c, label: c }))}
    />
  );
}
