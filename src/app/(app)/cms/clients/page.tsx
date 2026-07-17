import type { Metadata } from "next";
import { ClientLogo } from "@/models/ClientLogo";
import { loadList } from "@/lib/loadList";
import { clientSpec } from "@/app/api/cms/clients/route";
import { ClientsAdminClient, type ClientAdminRow } from "./ClientsAdminClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { result, locale } = await loadList(ClientLogo, "cms.clients:read", clientSpec, sp);
  return <ClientsAdminClient initial={result as unknown as ListResult<ClientAdminRow>} locale={locale} title={locale === "ar" ? "العملاء (الشعارات)" : "Clients (Logos)"} />;
}
