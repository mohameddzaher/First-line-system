import type { Metadata } from "next";
import { Company } from "@/models/Company";
import { loadList } from "@/lib/loadList";
import { companySpec } from "@/app/api/crm/companies/route";
import { CompaniesClient, type CompanyRow } from "./CompaniesClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Companies" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { result, locale } = await loadList(Company, "crm.companies:read", companySpec, sp);
  return (
    <CompaniesClient
      initial={result as unknown as ListResult<CompanyRow>}
      locale={locale}
      title={locale === "ar" ? "الشركات" : "Companies"}
    />
  );
}
