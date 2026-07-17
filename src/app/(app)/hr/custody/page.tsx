import type { Metadata } from "next";
import { Custody } from "@/models/Custody";
import { loadList } from "@/lib/loadList";
import { custodySpec } from "@/app/api/hr/custody/route";
import { getT } from "@/i18n/server";
import { employeeOptions } from "@/lib/pickerOptions";
import { CustodyClient } from "./CustodyClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Custody" };
export const dynamic = "force-dynamic";

export interface CustodyRow {
  _id: string;
  name: string;
  type: string;
  brand?: string;
  serial?: string;
  condition: string;
  status: string;
  assignedDate?: string;
  employee?: { _id: string; nameAr: string; employeeNumber?: string } | null;
}

export default async function CustodyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const { result, locale } = await loadList(Custody, "hr.custody:read", custodySpec, sp);
  const [t, employees] = await Promise.all([getT(), employeeOptions()]);
  return (
    <CustodyClient
      initial={result as unknown as ListResult<CustodyRow>}
      locale={locale}
      title={t("hr.custody")}
      employees={employees}
    />
  );
}
