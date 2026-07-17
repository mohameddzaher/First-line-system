import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { getSiteSettings } from "@/lib/siteContent";
import { SettingsEditor } from "./SettingsEditor";

export const metadata: Metadata = { title: "Website Content" };
export const dynamic = "force-dynamic";

export default async function CMSPage() {
  await requirePermission("cms.pages:read");
  const [settings, locale] = await Promise.all([getSiteSettings(), getLocale()]);
  return <SettingsEditor initial={JSON.parse(JSON.stringify(settings))} locale={locale} />;
}
