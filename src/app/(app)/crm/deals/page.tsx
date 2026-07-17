import type { Metadata } from "next";
import { Deal } from "@/models/Deal";
import { loadList } from "@/lib/loadList";
import { dealSpec } from "@/app/api/crm/deals/route";
import { companyOptions, userOptions } from "@/lib/pickerOptions";
import { DealsClient, type DealRow } from "./DealsClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Deals" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { result, locale } = await loadList(Deal, "crm.deals:read", dealSpec, sp);
  const [companies, users] = await Promise.all([companyOptions("customer"), userOptions()]);
  return (
    <DealsClient
      initial={result as unknown as ListResult<DealRow>}
      locale={locale}
      title={locale === "ar" ? "الصفقات" : "Deals"}
      companies={companies}
      users={users}
    />
  );
}
