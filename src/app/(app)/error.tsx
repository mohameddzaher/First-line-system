"use client";

import Link from "next/link";
import { ShieldAlert, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/provider";

/**
 * Catches errors thrown while rendering an internal page — most importantly a
 * permission check (AuthError "FORBIDDEN") — and shows a clean screen instead of
 * a raw 500. API routes return proper 403 JSON separately.
 */
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  const { t, locale } = useI18n();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-danger-soft text-danger ring-1 ring-danger/20">
        <ShieldAlert className="size-8" aria-hidden />
      </span>
      <h1 className="mt-6 text-xl font-bold text-fg">
        {locale === "ar" ? "تعذّر عرض هذه الصفحة" : "This page could not be shown"}
      </h1>
      <p className="mt-2 max-w-md text-sm text-fg-muted">
        {locale === "ar"
          ? "قد لا تملك صلاحية الوصول إلى هذه الصفحة، أو حدث خطأ غير متوقع."
          : "You may not have permission to view this page, or an unexpected error occurred."}
      </p>
      <div className="mt-6 flex gap-2">
        <Button variant="secondary" onClick={reset} icon={<RotateCw className="size-4" />}>
          {locale === "ar" ? "إعادة المحاولة" : "Try again"}
        </Button>
        <Link href="/dashboard">
          <Button>{t("nav.executive")}</Button>
        </Link>
      </div>
    </div>
  );
}
