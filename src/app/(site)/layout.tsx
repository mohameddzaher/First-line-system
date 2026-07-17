import { getSiteSettings } from "@/lib/siteContent";
import { getLocale } from "@/i18n/server";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, locale] = await Promise.all([getSiteSettings(), getLocale()]);
  const ar = locale === "ar";

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <SiteHeader brand={ar ? settings.brandName_ar : settings.brandName_en} />
      <main className="flex-1">{children}</main>
      <SiteFooter
        data={{
          brand: ar ? settings.brandName_ar : settings.brandName_en,
          tagline: ar ? settings.tagline_ar : settings.tagline_en,
          phones: settings.phones,
          emails: settings.emails,
          address: ar ? settings.address_ar : settings.address_en,
          social: settings.social,
        }}
      />
    </div>
  );
}
