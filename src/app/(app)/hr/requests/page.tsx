import type { Metadata } from "next";
import { EmployeeRequest } from "@/models/EmployeeRequest";
import { loadList } from "@/lib/loadList";
import { requestSpec } from "@/app/api/hr/requests/route";
import { getT } from "@/i18n/server";
import { employeeOptions } from "@/lib/pickerOptions";
import { RequestsClient } from "./RequestsClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Employee Requests" };
export const dynamic = "force-dynamic";

export interface RequestRow {
  _id: string;
  subject: string;
  category: string;
  status: string;
  updatedAt: string;
  employee?: { _id: string; nameAr: string } | null;
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const { result, locale } = await loadList(EmployeeRequest, "hr.requests:read", requestSpec, sp);
  const [t, employees] = await Promise.all([getT(), employeeOptions()]);
  return (
    <RequestsClient
      initial={result as unknown as ListResult<RequestRow>}
      locale={locale}
      title={t("hr.requests")}
      employees={employees}
    />
  );
}
