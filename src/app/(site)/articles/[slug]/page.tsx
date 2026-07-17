import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { getLocale } from "@/i18n/server";
import { Article } from "@/models/Article";
import { serialize } from "@/lib/serialize";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const [locale, article] = await Promise.all([getLocale(), Article.findOne({ slug, published: true }).lean()]);
  if (!article) return { title: "Article" };
  const ar = locale === "ar";
  return {
    title: ar ? article.title_ar : article.title_en,
    description: ar ? article.excerpt_ar : article.excerpt_en,
  };
}

export default async function ArticleDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();
  const [locale, doc] = await Promise.all([getLocale(), Article.findOne({ slug, published: true }).lean()]);
  if (!doc) notFound();

  // Fire-and-forget view count.
  Article.updateOne({ _id: doc._id }, { $inc: { views: 1 } }).catch(() => {});

  const a = serialize(doc) as unknown as Record<string, unknown>;
  const ar = locale === "ar";
  const body = (ar ? (a.body_ar as string) : (a.body_en as string)) || "";

  return (
    <article className="mx-auto max-w-3xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
      <Link href="/articles" className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg">
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        {ar ? "كل المقالات" : "All articles"}
      </Link>
      <h1 className="mt-6 text-3xl font-bold text-fg sm:text-4xl">{ar ? (a.title_ar as string) : (a.title_en as string)}</h1>
      {a.publishedAt ? <p className="mt-3 text-sm text-fg-subtle">{formatDate(a.publishedAt as string)}</p> : null}
      <div className="mt-8 aspect-[16/9] rounded-2xl bg-gradient-to-br from-primary/80 to-primary" />
      <div className="prose mt-8 max-w-none">
        {body.split("\n").filter(Boolean).map((para, i) => (
          <p key={i} className="mb-4 leading-relaxed text-fg">{para}</p>
        ))}
      </div>
    </article>
  );
}
