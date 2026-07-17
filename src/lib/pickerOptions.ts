import "server-only";
import { Employee } from "@/models/Employee";
import { LeaveType } from "@/models/LeaveType";
import { User } from "@/models/User";
import type { Locale } from "@/i18n/dictionaries";

/**
 * Options for form pickers. Employees are capped — for the very large roster the
 * form's search-driven pickers should be used, but these cover the common case
 * and every module's create dialog.
 */
export async function employeeOptions(): Promise<{ value: string; label: string }[]> {
  const employees = await Employee.find({ status: { $ne: "terminated" } })
    .select("nameAr employeeNumber")
    .sort({ nameAr: 1 })
    .limit(2000)
    .lean();
  return employees.map((e) => ({
    value: String(e._id),
    label: e.employeeNumber ? `${e.nameAr} · ${e.employeeNumber}` : e.nameAr,
  }));
}

export async function leaveTypeOptions(locale: Locale): Promise<{ value: string; label: string }[]> {
  const types = await LeaveType.find({ isActive: true }).select("nameAr nameEn").sort({ nameAr: 1 }).lean();
  return types.map((lt) => ({ value: String(lt._id), label: locale === "ar" ? lt.nameAr : lt.nameEn }));
}

export async function userOptions(): Promise<{ value: string; label: string }[]> {
  const users = await User.find({ isActive: true }).select("firstName lastName").sort({ firstName: 1 }).lean();
  return users.map((u) => ({ value: String(u._id), label: `${u.firstName} ${u.lastName}` }));
}

export async function warehouseOptions(): Promise<{ value: string; label: string }[]> {
  const { Warehouse } = await import("@/models/Warehouse");
  const rows = await Warehouse.find({ isActive: true }).select("name").sort({ name: 1 }).lean();
  return rows.map((w) => ({ value: String(w._id), label: w.name }));
}

export async function companyOptions(
  kind?: "customer" | "vendor" | "both",
): Promise<{ value: string; label: string }[]> {
  const { Company } = await import("@/models/Company");
  const filter = kind ? { kind: { $in: [kind, "both"] } } : {};
  const rows = await Company.find(filter as never).select("name nameAr").sort({ name: 1 }).limit(2000).lean();
  return rows.map((c) => ({ value: String(c._id), label: c.name }));
}
