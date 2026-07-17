import type { Metadata } from "next";
import { Article } from "@/models/Article";
import { loadList } from "@/lib/loadList";
import { articleSpec } from "@/app/api/cms/articles/route";
import { ArticlesAdminClient, type ArticleAdminRow } from "./ArticlesAdminClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Articles" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { result, locale } = await loadList(Article, "cms.articles:read", articleSpec, sp);
  return (
    <ArticlesAdminClient
      initial={result as unknown as ListResult<ArticleAdminRow>}
      locale={locale}
      title={locale === "ar" ? "المقالات" : "Articles"}
    />
  );
}
