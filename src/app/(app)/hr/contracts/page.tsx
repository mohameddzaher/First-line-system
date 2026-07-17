import type { Metadata } from "next";
import { Contract } from "@/models/Contract";
import { loadList } from "@/lib/loadList";
import { contractSpec } from "@/app/api/hr/contracts/route";
import { getT } from "@/i18n/server";
import { employeeOptions } from "@/lib/pickerOptions";
import { ContractsClient } from "./ContractsClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Contracts" };
export const dynamic = "force-dynamic";

export interface ContractRow {
  _id: string;
  type: string;
  startDate: string;
  endDate?: string;
  annualLeaveDays: number;
  status: string;
  employee?: { _id: string; nameAr: string; employeeNumber?: string } | null;
}

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const { result, locale } = await loadList(Contract, "hr.contracts:read", contractSpec, sp);
  const [t, employees] = await Promise.all([getT(), employeeOptions()]);
  return (
    <ContractsClient
      initial={result as unknown as ListResult<ContractRow>}
      locale={locale}
      title={t("hr.contracts")}
      employees={employees}
    />
  );
}
