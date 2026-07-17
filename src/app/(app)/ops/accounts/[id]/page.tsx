import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { ThirdPartyAccount } from "@/models/ThirdPartyAccount";
import { AuditLog } from "@/models/AuditLog";
import { serialize } from "@/lib/serialize";
import { employeeOptions } from "@/lib/pickerOptions";
import { AccountDetail } from "./AccountDetail";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("ops.accounts:read");
  await connectDB();
  const { id } = await params;
  if (!/^[0-9a-fA-F]{24}$/.test(id)) notFound();

  const account = await ThirdPartyAccount.findById(id)
    .populate("project", "nameAr nameEn")
    .populate("assignments.employee", "nameAr employeeNumber idNumber")
    .populate("history.employee", "nameAr employeeNumber")
    .lean();
  if (!account) notFound();

  const [locale, history, employees] = await Promise.all([
    getLocale(),
    AuditLog.find({ resource: "ops.assignments", resourceId: id }).sort({ createdAt: -1 }).limit(50).lean(),
    employeeOptions(),
  ]);

  return (
    <AccountDetail
      locale={locale}
      account={serialize(account) as never}
      audit={serialize(history) as never}
      employees={employees}
    />
  );
}
