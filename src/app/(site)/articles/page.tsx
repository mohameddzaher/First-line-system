import type { Metadata } from "next";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { getLocale } from "@/i18n/server";
import { Article } from "@/models/Article";
import { serialize } from "@/lib/serialize";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Articles" };
export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  await connectDB();
  const [locale, articles] = await Promise.all([
    getLocale(),
    Article.find({ published: true }).sort({ publishedAt: -1 }).lean(),
  ]);
  const ar = locale === "ar";
  const arts = serialize(articles) as unknown as Record<string, unknown>[];

  return (
    <>
      <PageHero title={ar ? "المقالات" : "Articles"} subtitle={ar ? "رؤى ومقالات حول اللوجستيات والتوصيل في المملكة" : "Insights on logistics and delivery in the Kingdom"} />
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        {arts.length === 0 ? (
          <p className="text-center text-fg-muted">{ar ? "لا توجد مقالات بعد." : "No articles yet."}</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {arts.map((a, i) => (
              <Reveal key={String(a._id)} delay={(i % 3) * 100}>
                <Link href={`/articles/${a.slug}`} className="group block h-full overflow-hidden rounded-2xl bg-surface ring-1 ring-border transition-all hover:-translate-y-1 hover:shadow-raised">
                  <div className="aspect-[16/9] bg-gradient-to-br from-primary/80 to-primary" />
                  <div className="p-5">
                    {a.publishedAt ? <p className="text-xs text-fg-subtle">{formatDate(a.publishedAt as string)}</p> : null}
                    <h3 className="mt-1 font-bold text-fg transition-colors group-hover:text-primary">{ar ? (a.title_ar as string) : (a.title_en as string)}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-fg-muted">{ar ? (a.excerpt_ar as string) : (a.excerpt_en as string)}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
