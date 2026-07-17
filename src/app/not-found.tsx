import Link from "next/link";
import { getLocale } from "@/i18n/server";

export default async function NotFound() {
  const locale = await getLocale();
  const ar = locale === "ar";
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg-subtle px-4 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-xl font-bold text-fg">{ar ? "الصفحة غير موجودة" : "Page not found"}</h1>
      <p className="mt-2 text-sm text-fg-muted">{ar ? "الصفحة التي تبحث عنها غير متوفرة." : "The page you're looking for doesn't exist."}</p>
      <Link href="/" className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-hover">
        {ar ? "العودة للرئيسية" : "Back home"}
      </Link>
    </div>
  );
}
