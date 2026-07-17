import type { Metadata } from "next";
import { SalesTarget } from "@/models/SalesTarget";
import { loadList } from "@/lib/loadList";
import { targetSpec } from "@/app/api/sales/targets/route";
import { userOptions } from "@/lib/pickerOptions";
import { TargetsClient, type TargetRow } from "./TargetsClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Targets" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { result, locale } = await loadList(SalesTarget, "sales.targets:read", targetSpec, sp);
  const users = await userOptions();
  return (
    <TargetsClient
      initial={result as unknown as ListResult<TargetRow>}
      locale={locale}
      title={locale === "ar" ? "المستهدفات" : "Targets"}
      users={users}
    />
  );
}
