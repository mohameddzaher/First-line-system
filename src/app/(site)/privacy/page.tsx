import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/siteContent";
import { getLocale } from "@/i18n/server";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = { title: "Privacy Policy" };
export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const [s, locale] = await Promise.all([getSiteSettings(), getLocale()]);
  const ar = locale === "ar";
  const body = (ar ? s.privacy_ar : s.privacy_en) || (ar ? "سيتم تحديث سياسة الخصوصية قريبًا." : "Our privacy policy will be updated soon.");

  return (
    <>
      <PageHero title={ar ? "سياسة الخصوصية" : "Privacy Policy"} />
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        {body.split("\n").filter(Boolean).map((p, i) => (
          <p key={i} className="mb-4 leading-relaxed text-fg-muted">{p}</p>
        ))}
      </section>
    </>
  );
}
