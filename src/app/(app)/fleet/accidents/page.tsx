import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale, getT } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Accident } from "@/models/Accident";
import { Vehicle } from "@/models/Vehicle";
import { runListQuery } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import { serialize } from "@/lib/serialize";
import { accidentSpec } from "@/app/api/fleet/accidents/route";
import { employeeOptions } from "@/lib/pickerOptions";
import { AccidentsClient, type AccidentRow } from "./AccidentsClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Accidents" };
export const dynamic = "force-dynamic";

export default async function AccidentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requirePermission("fleet.accidents:read");
  await connectDB();
  const [locale, t, sp] = await Promise.all([getLocale(), getT(), searchParams]);
  const query = parseListQuery(new URLSearchParams(sp));

  const [result, vehicles, employees] = await Promise.all([
    runListQuery(Accident, query, accidentSpec),
    Vehicle.find({}).select("plateNumber").sort({ plateNumber: 1 }).limit(2000).lean(),
    employeeOptions(),
  ]);

  return (
    <AccidentsClient
      initial={serialize(result) as unknown as ListResult<AccidentRow>}
      locale={locale}
      title={t("fleet.accidents")}
      vehicles={vehicles.map((v) => ({ value: String(v._id), label: v.plateNumber }))}
      employees={employees}
    />
  );
}
