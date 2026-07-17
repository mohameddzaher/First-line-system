import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/siteContent";
import { getLocale } from "@/i18n/server";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Eye, Target } from "lucide-react";

export const metadata: Metadata = { title: "About Us" };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [s, locale] = await Promise.all([getSiteSettings(), getLocale()]);
  const ar = locale === "ar";
  return (
    <>
      <PageHero title={ar ? "من نحن" : "About Us"} subtitle={ar ? s.tagline_ar : s.tagline_en} />
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-lg leading-relaxed text-fg">{ar ? s.about_ar : s.about_en}</p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <Reveal delay={100}>
            <div className="h-full rounded-2xl bg-surface p-7 ring-1 ring-border">
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Eye className="size-6" aria-hidden /></span>
              <h3 className="mt-4 text-lg font-bold text-fg">{ar ? "رؤيتنا" : "Our Vision"}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{ar ? s.vision_ar : s.vision_en}</p>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="h-full rounded-2xl bg-surface p-7 ring-1 ring-border">
              <span className="flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent"><Target className="size-6" aria-hidden /></span>
              <h3 className="mt-4 text-lg font-bold text-fg">{ar ? "رسالتنا" : "Our Mission"}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{ar ? s.mission_ar : s.mission_en}</p>
            </div>
          </Reveal>
        </div>

        {(ar ? s.history_ar : s.history_en) && (
          <Reveal delay={100} className="mt-12">
            <h2 className="text-2xl font-bold text-fg">{ar ? "تاريخنا" : "Our History"}</h2>
            <p className="mt-4 leading-relaxed text-fg-muted">{ar ? s.history_ar : s.history_en}</p>
          </Reveal>
        )}
      </section>
    </>
  );
}
