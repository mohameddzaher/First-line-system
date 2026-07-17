import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getLocale, getT } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { EmployeeRequest } from "@/models/EmployeeRequest";
import { serialize } from "@/lib/serialize";
import { MyRequestsClient } from "./MyRequestsClient";

export const metadata: Metadata = { title: "My Requests" };
export const dynamic = "force-dynamic";

export default async function MyRequestsPage() {
  const user = await requireUser();
  await connectDB();
  const [locale, t] = await Promise.all([getLocale(), getT()]);

  const linked = Boolean(user.employeeId);
  const requests = linked
    ? await EmployeeRequest.find({ employee: user.employeeId }).sort({ createdAt: -1 }).lean()
    : [];

  return (
    <MyRequestsClient
      linked={linked}
      title={t("self.myRequests")}
      locale={locale}
      requests={serialize(requests) as never}
    />
  );
}
