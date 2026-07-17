import type { Metadata } from "next";
import { Leave } from "@/models/Leave";
import { loadList } from "@/lib/loadList";
import { leaveSpec } from "@/app/api/hr/leaves/route";
import { getT } from "@/i18n/server";
import { employeeOptions, leaveTypeOptions } from "@/lib/pickerOptions";
import { LeavesClient } from "./LeavesClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Leave Requests" };
export const dynamic = "force-dynamic";

export interface LeaveRow {
  _id: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason?: string;
  balanceAtRequest?: number;
  employee?: { _id: string; nameAr: string } | null;
  leaveType?: { _id: string; nameAr: string; nameEn: string } | null;
}

export default async function LeavesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const { result, locale } = await loadList(Leave, "hr.leaves:read", leaveSpec, sp);
  const [t, employees, leaveTypes] = await Promise.all([
    getT(),
    employeeOptions(),
    leaveTypeOptions(locale),
  ]);
  return (
    <LeavesClient
      initial={result as unknown as ListResult<LeaveRow>}
      locale={locale}
      title={t("hr.leaves")}
      employees={employees}
      leaveTypes={leaveTypes}
    />
  );
}
