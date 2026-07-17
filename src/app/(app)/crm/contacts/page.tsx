import type { Metadata } from "next";
import { Contact } from "@/models/Contact";
import { loadList } from "@/lib/loadList";
import { contactSpec } from "@/app/api/crm/contacts/route";
import { getT } from "@/i18n/server";
import { companyOptions } from "@/lib/pickerOptions";
import { ContactsClient, type ContactRow } from "./ContactsClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Contacts" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { result, locale } = await loadList(Contact, "crm.contacts:read", contactSpec, sp);
  const t = await getT();
  const companies = await companyOptions();
  return (
    <ContactsClient
      initial={result as unknown as ListResult<ContactRow>}
      locale={locale}
      title={locale === "ar" ? "جهات الاتصال" : "Contacts"}
      companies={companies}
    />
  );
}
