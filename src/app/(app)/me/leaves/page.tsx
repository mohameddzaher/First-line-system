import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getLocale, getT } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Leave } from "@/models/Leave";
import { LeaveType } from "@/models/LeaveType";
import { computeLeaveBalance } from "@/lib/leaveBalance";
import { serialize } from "@/lib/serialize";
import { MyLeavesClient } from "./MyLeavesClient";

export const metadata: Metadata = { title: "My Leaves" };
export const dynamic = "force-dynamic";

export default async function MyLeavesPage() {
  const user = await requireUser();
  await connectDB();
  const [locale, t] = await Promise.all([getLocale(), getT()]);

  const linked = Boolean(user.employeeId);
  const [leaves, types, balance] = linked
    ? await Promise.all([
        Leave.find({ employee: user.employeeId }).populate("leaveType", "nameAr nameEn").sort({ createdAt: -1 }).lean(),
        LeaveType.find({ isActive: true }).select("nameAr nameEn").sort({ nameAr: 1 }).lean(),
        computeLeaveBalance(user.employeeId as string),
      ])
    : [[], [], null];

  return (
    <MyLeavesClient
      linked={linked}
      title={t("self.myLeaves")}
      locale={locale}
      leaves={serialize(leaves) as never}
      leaveTypes={(types as { _id: string; nameAr: string; nameEn: string }[]).map((lt) => ({
        value: String(lt._id),
        label: locale === "ar" ? lt.nameAr : lt.nameEn,
      }))}
      balance={serialize(balance) as never}
    />
  );
}
