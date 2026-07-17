import type { Metadata } from "next";
import { LeaveType } from "@/models/LeaveType";
import { loadList } from "@/lib/loadList";
import { leaveTypeSpec } from "@/app/api/hr/leave-types/route";
import { getT } from "@/i18n/server";
import { LeaveTypesClient } from "./LeaveTypesClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Leave Types" };
export const dynamic = "force-dynamic";

export default async function LeaveTypesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const { result, locale } = await loadList(LeaveType, "hr.leaveTypes:read", leaveTypeSpec, sp);
  const t = await getT();

  return (
    <LeaveTypesClient
      initial={result as unknown as ListResult<LeaveTypeRow>}
      locale={locale}
      title={t("hr.leaveTypes")}
    />
  );
}

export interface LeaveTypeRow {
  _id: string;
  nameAr: string;
  nameEn: string;
  code: string;
  paid: boolean;
  affectsBalance: boolean;
  isActive: boolean;
}
