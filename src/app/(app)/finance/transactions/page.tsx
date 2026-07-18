import type { Metadata } from "next";
import { FinanceTransaction } from "@/models/FinanceTransaction";
import { loadList } from "@/lib/loadList";
import { txnSpec } from "@/app/api/finance/transactions/route";
import { connectDB } from "@/lib/db";
import { Project } from "@/models/Project";
import { getLocale } from "@/i18n/server";
import { TransactionsClient, type TxnRow } from "./TransactionsClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Transactions" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { result } = await loadList(FinanceTransaction, "finance.transactions:read", txnSpec, sp);
  await connectDB();
  const [locale, projects] = await Promise.all([getLocale(), Project.find({ isActive: true }).select("nameAr nameEn").lean()]);
  return (
    <TransactionsClient
      initial={result as unknown as ListResult<TxnRow>}
      locale={locale}
      title={locale === "ar" ? "الحركات المالية" : "Transactions"}
      projects={projects.map((p) => ({ value: String(p._id), label: locale === "ar" ? p.nameAr : p.nameEn ?? p.nameAr }))}
    />
  );
}
