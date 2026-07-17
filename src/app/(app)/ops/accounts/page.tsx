import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale, getT } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { ThirdPartyAccount } from "@/models/ThirdPartyAccount";
import { Project } from "@/models/Project";
import { runListQuery } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import { serialize } from "@/lib/serialize";
import { accountSpec } from "@/app/api/ops/accounts/route";
import { employeeOptions } from "@/lib/pickerOptions";
import { AccountsClient, type AccountRow } from "./AccountsClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Project Accounts" };
export const dynamic = "force-dynamic";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requirePermission("ops.accounts:read");
  await connectDB();
  const [locale, t, sp] = await Promise.all([getLocale(), getT(), searchParams]);
  const query = parseListQuery(new URLSearchParams(sp));

  const [result, projects, employees] = await Promise.all([
    runListQuery(ThirdPartyAccount, query, accountSpec),
    Project.find({ isActive: true }).select("nameAr nameEn").lean(),
    employeeOptions(),
  ]);

  return (
    <AccountsClient
      initial={serialize(result) as unknown as ListResult<AccountRow>}
      locale={locale}
      title={locale === "ar" ? "حسابات المشاريع" : "Project Accounts"}
      projects={projects.map((p) => ({ value: String(p._id), label: locale === "ar" ? p.nameAr : p.nameEn ?? p.nameAr }))}
      employees={employees}
    />
  );
}
