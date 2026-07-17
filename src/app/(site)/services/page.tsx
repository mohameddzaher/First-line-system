import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/siteContent";
import { getLocale } from "@/i18n/server";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Bike, Truck, Boxes, Settings } from "lucide-react";

export const metadata: Metadata = { title: "Services" };
export const dynamic = "force-dynamic";

const ICONS: Record<string, typeof Bike> = { Bike, Truck, Boxes, Settings };

export default async function ServicesPage() {
  const [s, locale] = await Promise.all([getSiteSettings(), getLocale()]);
  const ar = locale === "ar";
  return (
    <>
      <PageHero title={ar ? "خدماتنا" : "Our Services"} subtitle={ar ? "حلول لوجستية متكاملة تغطي كل احتياجات التوصيل والنقل" : "Integrated logistics solutions covering all delivery and transport needs"} />
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2">
          {s.services.map((sv, i) => {
            const Icon = ICONS[sv.icon] ?? Boxes;
            return (
              <Reveal key={sv.title_en} delay={i * 80}>
                <div className="flex h-full gap-5 rounded-2xl bg-surface p-7 ring-1 ring-border shadow-card">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-7" aria-hidden /></span>
                  <div>
                    <h3 className="text-lg font-bold text-fg">{ar ? sv.title_ar : sv.title_en}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-fg-muted">{ar ? sv.desc_ar : sv.desc_en}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
    </>
  );
}
