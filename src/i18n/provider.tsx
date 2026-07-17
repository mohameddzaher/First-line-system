"use client";

import { createContext, useCallback, useContext, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  dictionaries,
  dirFor,
  type Locale,
  type TranslationKey,
} from "@/i18n/dictionaries";

interface I18nValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
  isSwitching: boolean;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isSwitching, startTransition] = useTransition();

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const dict = dictionaries[locale] as Record<string, string>;
      // Fall back to the other locale, then to the key itself, so a missing
      // translation shows something meaningful instead of blank UI.
      let text = dict[key] ?? (dictionaries.en as Record<string, string>)[key] ?? key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, String(value));
        }
      }
      return text;
    },
    [locale],
  );

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `fl_locale=${next};path=/;max-age=31536000;samesite=lax`;
      startTransition(() => router.refresh());
    },
    [router],
  );

  const value = useMemo<I18nValue>(
    () => ({ locale, dir: dirFor(locale), t, setLocale, isSwitching }),
    [locale, t, setLocale, isSwitching],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/** Shorthand for the common case. */
export function useT() {
  return useI18n().t;
}
