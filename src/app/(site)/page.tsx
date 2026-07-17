import type { Metadata } from "next";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { getSiteSettings } from "@/lib/siteContent";
import { getLocale } from "@/i18n/server";
import { Article } from "@/models/Article";
import { ClientLogo } from "@/models/ClientLogo";
import { serialize } from "@/lib/serialize";
import { Reveal } from "@/components/site/Reveal";
import { FaqList } from "@/components/site/FaqList";
import { Bike, Truck, Boxes, Settings, ArrowLeft, Target, Eye, Building2 } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const [s, locale] = await Promise.all([getSiteSettings(), getLocale()]);
  const ar = locale === "ar";
  return {
    title: ar ? s.seo_title_ar : s.seo_title_en,
    description: ar ? s.seo_description_ar : s.seo_description_en,
    keywords: s.seo_keywords,
  };
}

export const dynamic = "force-dynamic";

const ICONS: Record<string, typeof Bike> = { Bike, Truck, Boxes, Settings };

export default async function HomePage() {
  await connectDB();
  const [s, locale, articles, clients] = await Promise.all([
    getSiteSettings(),
    getLocale(),
    Article.find({ published: true }).sort({ publishedAt: -1 }).limit(3).lean(),
    ClientLogo.find({ active: true }).sort({ order: 1 }).lean(),
  ]);
  const ar = locale === "ar";
  const arts = serialize(articles) as unknown as Record<string, unknown>[];
  const logos = serialize(clients) as unknown as Record<string, unknown>[];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary pt-16 text-primary-fg">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <Reveal className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-fg/10 px-3 py-1 text-xs font-medium ring-1 ring-primary-fg/20">
              <span className="size-1.5 rounded-full bg-accent" /> {ar ? "المملكة العربية السعودية" : "Saudi Arabia"}
            </span>
            <h1 className="mt-6 text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">
              {ar ? s.hero_title_ar : s.hero_title_en}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-fg/75">
              {ar ? s.hero_subtitle_ar : s.hero_subtitle_en}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-fg shadow-lg transition-transform hover:brightness-105 active:translate-y-px">
                {ar ? s.hero_ctaLabel_ar : s.hero_ctaLabel_en}
                <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-primary-fg/10 px-6 py-3 text-sm font-semibold ring-1 ring-primary-fg/20 transition-colors hover:bg-primary-fg/20">
                {ar ? "تواصل معنا" : "Contact Us"}
              </Link>
            </div>
          </Reveal>

          <Reveal delay={150} className="mt-16 grid grid-cols-2 gap-6 border-t border-primary-fg/15 pt-10 sm:grid-cols-4">
            {s.stats.map((st) => (
              <div key={st.label_en}>
                <p className="text-3xl font-bold text-accent tabular sm:text-4xl">{st.value}</p>
                <p className="mt-1 text-sm text-primary-fg/60">{ar ? st.label_ar : st.label_en}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Vision / Mission / About */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { icon: Eye, title: ar ? "رؤيتنا" : "Our Vision", body: ar ? s.vision_ar : s.vision_en },
            { icon: Target, title: ar ? "رسالتنا" : "Our Mission", body: ar ? s.mission_ar : s.mission_en },
            { icon: Building2, title: ar ? "من نحن" : "Who We Are", body: ar ? s.about_ar : s.about_en },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.title} delay={i * 100}>
                <div className="h-full rounded-2xl bg-surface p-7 ring-1 ring-border shadow-card transition-shadow hover:shadow-raised">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-6" aria-hidden /></span>
                  <h3 className="mt-5 text-lg font-bold text-fg">{c.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-fg-muted">{c.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Services */}
      <section className="bg-bg-subtle py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-fg">{ar ? "خدماتنا" : "Our Services"}</h2>
            <p className="mt-3 text-fg-muted">{ar ? "حلول لوجستية متكاملة تغطي كل احتياجات التوصيل" : "Integrated logistics solutions covering every delivery need"}</p>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {s.services.map((sv, i) => {
              const Icon = ICONS[sv.icon] ?? Boxes;
              return (
                <Reveal key={sv.title_en} delay={i * 80}>
                  <div className="group h-full rounded-2xl bg-surface p-6 ring-1 ring-border transition-all hover:-translate-y-1 hover:shadow-raised">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-fg"><Icon className="size-6" aria-hidden /></span>
                    <h3 className="mt-5 font-bold text-fg">{ar ? sv.title_ar : sv.title_en}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-fg-muted">{ar ? sv.desc_ar : sv.desc_en}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Clients */}
      {logos.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-fg-subtle">{ar ? "شركاؤنا" : "Our Partners"}</p>
          </Reveal>
          <Reveal delay={100} className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
            {logos.map((c) => (
              <img key={String(c._id)} src={c.logo as string} alt={c.name as string} className="h-9 w-auto opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0" />
            ))}
          </Reveal>
        </section>
      )}

      {/* Articles */}
      {arts.length > 0 && (
        <section className="bg-bg-subtle py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold text-fg">{ar ? "من المدوّنة" : "From the Blog"}</h2>
                <p className="mt-2 text-fg-muted">{ar ? "رؤى ومقالات حول اللوجستيات والتوصيل" : "Insights on logistics and delivery"}</p>
              </div>
              <Link href="/articles" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex">
                {ar ? "عرض الكل" : "View all"} <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
              </Link>
            </Reveal>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {arts.map((a, i) => (
                <Reveal key={String(a._id)} delay={i * 100}>
                  <Link href={`/articles/${a.slug}`} className="group block h-full overflow-hidden rounded-2xl bg-surface ring-1 ring-border transition-all hover:-translate-y-1 hover:shadow-raised">
                    <div className="aspect-[16/9] bg-gradient-to-br from-primary/80 to-primary" />
                    <div className="p-5">
                      <h3 className="font-bold text-fg transition-colors group-hover:text-primary">{ar ? (a.title_ar as string) : (a.title_en as string)}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-fg-muted">{ar ? (a.excerpt_ar as string) : (a.excerpt_en as string)}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {s.faqs.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <h2 className="text-3xl font-bold text-fg">{ar ? "الأسئلة الشائعة" : "Frequently Asked Questions"}</h2>
          </Reveal>
          <Reveal delay={100} className="mt-10">
            <FaqList faqs={s.faqs.map((f) => ({ q: ar ? f.q_ar : f.q_en, a: ar ? f.a_ar : f.a_en }))} />
          </Reveal>
        </section>
      )}

      {/* CTA */}
      <section className="bg-primary py-16 text-primary-fg">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-3xl font-bold">{ar ? "جاهزون لخدمتكم" : "Ready to work with us?"}</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-fg/75">{ar ? "تواصلوا معنا اليوم لمناقشة احتياجاتكم اللوجستية." : "Get in touch today to discuss your logistics needs."}</p>
            <Link href="/contact" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3 text-sm font-semibold text-accent-fg shadow-lg transition-transform hover:brightness-105 active:translate-y-px">
              {ar ? "تواصل معنا" : "Contact Us"}
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
