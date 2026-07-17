import "server-only";
import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  dictionaries,
  isLocale,
  type Locale,
  type TranslationKey,
} from "@/i18n/dictionaries";

export const LOCALE_COOKIE = "fl_locale";
export const THEME_COOKIE = "fl_theme";

export type Theme = "light" | "dark" | "system";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getTheme(): Promise<Theme> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

/** Server-side translator, for use in Server Components and route handlers. */
export async function getT(): Promise<(key: TranslationKey) => string> {
  const locale = await getLocale();
  const dict = dictionaries[locale] as Record<string, string>;
  return (key: TranslationKey) =>
    dict[key] ?? (dictionaries.en as Record<string, string>)[key] ?? key;
}
