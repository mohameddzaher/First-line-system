import type { Metadata } from "next";
import { License } from "@/models/License";
import { loadList } from "@/lib/loadList";
import { licenseSpec } from "@/app/api/hr/licenses/route";
import { getT } from "@/i18n/server";
import { LicensesClient } from "./LicensesClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Licenses & Subscriptions" };
export const dynamic = "force-dynamic";

export interface LicenseRow {
  _id: string;
  name: string;
  category: string;
  durationLabel?: string;
  expiryDate: string;
  location?: string;
  number?: string;
}

export default async function LicensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const { result, locale } = await loadList(License, "hr.licenses:read", licenseSpec, sp);
  const t = await getT();
  return (
    <LicensesClient
      initial={result as unknown as ListResult<LicenseRow>}
      locale={locale}
      title={t("hr.licenses")}
    />
  );
}
