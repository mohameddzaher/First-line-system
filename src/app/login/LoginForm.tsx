"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Languages } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/provider";

export function LoginForm({ next }: { next: string }) {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const { landing } = (await res.json().catch(() => ({}))) as { landing?: string };
        toast.success(t("auth.welcomeBack"));
        // Honour an explicit ?next=, else send the user to the first page their
        // role can actually open (not everyone can see the executive dashboard).
        const target = next && next !== "/dashboard" ? next : (landing ?? "/me/profile");
        // replace() so Back doesn't land on the login form; refresh() re-runs the
        // server layout so the shell renders with the new session.
        router.replace(target);
        router.refresh();
        return;
      }

      const data = await res.json().catch(() => ({}));
      const lockMinutes = Math.max(1, Math.ceil((data.retryAfter ?? 900) / 60));
      const message =
        data.error === "ACCOUNT_DISABLED"
          ? t("auth.accountDisabled")
          : data.error === "ACCOUNT_LOCKED"
            ? locale === "ar"
              ? `تم قفل الحساب مؤقتاً بعد محاولات فاشلة متكررة. يُرجى المحاولة بعد ${lockMinutes} دقيقة، أو مراجعة مسؤول النظام.`
              : `Account temporarily locked after repeated failed attempts. Try again in ${lockMinutes} minutes, or contact your administrator.`
            : data.error === "TOO_MANY_ATTEMPTS"
              ? locale === "ar"
                ? "محاولات كثيرة جداً. يُرجى المحاولة بعد ١٠ دقائق."
                : "Too many attempts. Please try again in 10 minutes."
              : t("auth.invalidCredentials");

      setError(message);
      setBusy(false);
    } catch {
      setError(t("common.somethingWentWrong"));
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5 lg:hidden">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-fg">
            FL
          </span>
          <span className="font-semibold text-fg">{t("app.name")}</span>
        </div>
        <button
          type="button"
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          className="ms-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
        >
          <Languages className="size-4" aria-hidden />
          {locale === "ar" ? "English" : "عربي"}
        </button>
      </div>

      <h1 className="text-2xl font-bold text-fg">{t("auth.welcomeBack")}</h1>
      <p className="mt-1.5 text-sm text-fg-muted">{t("auth.loginSubtitle")}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            className="animate-[slide-up_0.2s_ease-out] rounded-lg bg-danger-soft px-4 py-3 text-sm font-medium text-danger ring-1 ring-danger/20"
          >
            {error}
          </div>
        )}

        <Input
          type="email"
          label={t("auth.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
          dir="ltr"
          placeholder="name@firstline.com"
          disabled={busy}
        />

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            label={t("auth.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            dir="ltr"
            disabled={busy}
            className="pe-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute end-2 top-[30px] rounded-md p-1.5 text-fg-subtle transition-colors hover:text-fg"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>

        <Button
          type="submit"
          size="lg"
          loading={busy}
          className="w-full"
          icon={<LogIn className="size-4" />}
        >
          {busy ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
      </form>
    </div>
  );
}
