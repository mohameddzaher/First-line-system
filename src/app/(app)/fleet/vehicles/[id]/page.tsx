import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Vehicle } from "@/models/Vehicle";
import { Accident } from "@/models/Accident";
import { Maintenance } from "@/models/Maintenance";
import { AuditLog } from "@/models/AuditLog";
import { serialize } from "@/lib/serialize";
import { employeeOptions } from "@/lib/pickerOptions";
import { VehicleProfile } from "./VehicleProfile";

export const metadata: Metadata = { title: "Vehicle" };
export const dynamic = "force-dynamic";

export default async function VehicleProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("fleet.vehicles:read");
  await connectDB();
  const { id } = await params;
  if (!/^[0-9a-fA-F]{24}$/.test(id)) notFound();

  const vehicle = await Vehicle.findById(id)
    .populate("department", "nameAr nameEn")
    .populate("project", "nameAr nameEn")
    .populate("currentAuthorization.employee", "nameAr employeeNumber")
    .populate("authorizations.employee", "nameAr employeeNumber")
    .lean();
  if (!vehicle) notFound();

  const [locale, accidents, maintenance, history, employees] = await Promise.all([
    getLocale(),
    Accident.find({ vehicle: id }).populate("employee", "nameAr").sort({ date: -1 }).lean(),
    Maintenance.find({ vehicle: id }).sort({ date: -1 }).lean(),
    AuditLog.find({ resource: { $in: ["fleet.authorizations", "fleet.vehicles", "fleet.maintenance"] }, resourceId: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    employeeOptions(),
  ]);

  return (
    <VehicleProfile
      locale={locale}
      vehicle={serialize(vehicle) as never}
      accidents={serialize(accidents) as never}
      maintenance={serialize(maintenance) as never}
      history={serialize(history) as never}
      employees={employees}
    />
  );
}
