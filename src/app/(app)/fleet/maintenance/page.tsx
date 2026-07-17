import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale, getT } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Maintenance } from "@/models/Maintenance";
import { Vehicle } from "@/models/Vehicle";
import { runListQuery } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import { serialize } from "@/lib/serialize";
import { maintenanceSpec } from "@/app/api/fleet/maintenance/route";
import { MaintenanceClient, type MaintenanceRow } from "./MaintenanceClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Maintenance" };
export const dynamic = "force-dynamic";

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requirePermission("fleet.maintenance:read");
  await connectDB();
  const [locale, t, sp] = await Promise.all([getLocale(), getT(), searchParams]);
  const query = parseListQuery(new URLSearchParams(sp));

  const [result, vehicles] = await Promise.all([
    runListQuery(Maintenance, query, maintenanceSpec),
    Vehicle.find({}).select("plateNumber plateLatin").sort({ plateNumber: 1 }).limit(3000).lean(),
  ]);

  return (
    <MaintenanceClient
      initial={serialize(result) as unknown as ListResult<MaintenanceRow>}
      locale={locale}
      title={t("fleet.maintenance")}
      vehicles={vehicles.map((v) => ({ value: String(v._id), label: v.plateNumber, hint: v.plateLatin }))}
    />
  );
}
