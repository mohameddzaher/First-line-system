import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Employee } from "@/models/Employee";
import { Contract } from "@/models/Contract";
import { Leave } from "@/models/Leave";
import { Custody } from "@/models/Custody";
import { EmployeeRequest } from "@/models/EmployeeRequest";
import { AuditLog } from "@/models/AuditLog";
import { User } from "@/models/User";
import { computeLeaveBalance } from "@/lib/leaveBalance";
import { serialize } from "@/lib/serialize";
import { EmployeeProfile } from "./EmployeeProfile";

export const metadata: Metadata = { title: "Employee Profile" };
export const dynamic = "force-dynamic";

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("hr.employees:read");
  await connectDB();

  const { id } = await params;
  if (!/^[0-9a-fA-F]{24}$/.test(id)) notFound();

  const employee = await Employee.findById(id)
    .populate("department", "nameAr nameEn")
    .populate("project", "nameAr nameEn")
    .lean();
  if (!employee) notFound();

  const [locale, contracts, leaves, custody, requests, history, login, balance] = await Promise.all([
    getLocale(),
    Contract.find({ employee: id }).sort({ startDate: -1 }).lean(),
    Leave.find({ employee: id }).populate("leaveType", "nameAr nameEn code").sort({ startDate: -1 }).lean(),
    Custody.find({ employee: id }).sort({ assignedDate: -1 }).lean(),
    EmployeeRequest.find({ employee: id }).sort({ createdAt: -1 }).lean(),
    AuditLog.find({ resource: "hr.employees", resourceId: id }).sort({ createdAt: -1 }).limit(50).lean(),
    User.findOne({ employee: id }).select("firstName lastName email role isActive").lean(),
    computeLeaveBalance(id),
  ]);

  return (
    <EmployeeProfile
      locale={locale}
      employee={serialize(employee) as never}
      contracts={serialize(contracts) as never}
      leaves={serialize(leaves) as never}
      custody={serialize(custody) as never}
      requests={serialize(requests) as never}
      history={serialize(history) as never}
      linkedUser={serialize(login) as never}
      balance={serialize(balance) as never}
    />
  );
}
