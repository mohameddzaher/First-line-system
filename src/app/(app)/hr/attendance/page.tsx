import type { Metadata } from "next";
import { Attendance } from "@/models/Attendance";
import { loadList } from "@/lib/loadList";
import { attendanceSpec } from "@/app/api/hr/attendance/route";
import { getT } from "@/i18n/server";
import { employeeOptions } from "@/lib/pickerOptions";
import { AttendanceClient, type AttendanceRow } from "./AttendanceClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Attendance" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { result, locale } = await loadList(Attendance, "hr.attendance:read", attendanceSpec, sp);
  const [t, employees] = await Promise.all([getT(), employeeOptions()]);
  return (
    <AttendanceClient
      initial={result as unknown as ListResult<AttendanceRow>}
      locale={locale}
      title={t("hr.attendance")}
      employees={employees}
    />
  );
}
