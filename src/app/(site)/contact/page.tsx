import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/siteContent";
import { getLocale } from "@/i18n/server";
import { PageHero } from "@/components/site/PageHero";
import { ContactForm } from "@/components/site/ContactForm";
import { Phone, Mail, MapPin } from "lucide-react";

export const metadata: Metadata = { title: "Contact Us" };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const [s, locale] = await Promise.all([getSiteSettings(), getLocale()]);
  const ar = locale === "ar";

  return (
    <>
      <PageHero title={ar ? "تواصل معنا" : "Contact Us"} subtitle={ar ? "نسعد بتواصلكم معنا لأي استفسار أو شراكة" : "We'd love to hear from you"} />
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-fg">{ar ? "معلومات التواصل" : "Get in touch"}</h2>
            <div className="mt-6 space-y-4">
              {s.phones.map((p) => (
                <a key={p} href={`tel:${p}`} className="flex items-center gap-3 text-fg-muted transition-colors hover:text-fg">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Phone className="size-5" aria-hidden /></span>
                  <span dir="ltr">{p}</span>
                </a>
              ))}
              {s.emails.map((em) => (
                <a key={em} href={`mailto:${em}`} className="flex items-center gap-3 text-fg-muted transition-colors hover:text-fg">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Mail className="size-5" aria-hidden /></span>
                  <span dir="ltr">{em}</span>
                </a>
              ))}
              <div className="flex items-start gap-3 text-fg-muted">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><MapPin className="size-5" aria-hidden /></span>
                <span>{ar ? s.address_ar : s.address_en}</span>
              </div>
            </div>

            {s.branches.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold text-fg">{ar ? "فروعنا" : "Our Branches"}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.branches.map((b, i) => (
                    <span key={i} className="rounded-lg bg-bg-subtle px-3 py-1.5 text-sm text-fg-muted ring-1 ring-border">
                      {ar ? b.city_ar : b.city_en}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {s.mapEmbedUrl && (
              <div className="mt-8 overflow-hidden rounded-2xl ring-1 ring-border">
                <iframe src={s.mapEmbedUrl} title="map" className="h-64 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-surface p-7 ring-1 ring-border shadow-card">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
