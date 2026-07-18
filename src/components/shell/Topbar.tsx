"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Sun, Moon, Monitor, Languages, LogOut, User } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { NotificationBell } from "@/components/shell/NotificationBell";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import { useToast } from "@/components/ui/Toast";
import { ROLES } from "@/lib/rbac";
import { cn, initials } from "@/lib/utils";
import type { CurrentUser } from "@/lib/auth";

export function Topbar({ user, onMenuClick }: { user: CurrentUser; onMenuClick: () => void }) {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  const signOut = async () => {
    setSigningOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success(t("auth.loggedOut"));
      // replace() so Back can't return to an authenticated page.
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error(t("common.somethingWentWrong"));
      setSigningOut(false);
    }
  };

  const role = ROLES[user.role];
  const roleLabel = locale === "ar" ? role?.labelAr : role?.labelEn;

  const themes: { value: Theme; icon: typeof Sun; labelKey: "pref.themeLight" | "pref.themeDark" | "pref.themeSystem" }[] = [
    { value: "light", icon: Sun, labelKey: "pref.themeLight" },
    { value: "dark", icon: Moon, labelKey: "pref.themeDark" },
    { value: "system", icon: Monitor, labelKey: "pref.themeSystem" },
  ];

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <div className="flex-1" />

      <NotificationBell />

      {/* Language */}
      <button
        type="button"
        onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
        aria-label={t("pref.language")}
        title={t("pref.language")}
      >
        <Languages className="size-4" aria-hidden />
        <span>{locale === "ar" ? "EN" : "عربي"}</span>
      </button>

      {/* Theme */}
      <div
        className="flex items-center gap-0.5 rounded-lg bg-bg-subtle p-0.5 ring-1 ring-border"
        role="group"
        aria-label={t("pref.theme")}
      >
        {themes.map(({ value, icon: Icon, labelKey }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={theme === value}
            aria-label={t(labelKey)}
            title={t(labelKey)}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              theme === value
                ? "bg-surface text-fg shadow-sm"
                : "text-fg-subtle hover:text-fg",
            )}
          >
            <Icon className="size-4" aria-hidden />
          </button>
        ))}
      </div>

      {/* User menu */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className="flex items-center gap-2.5 rounded-lg p-1 ps-2 transition-colors hover:bg-surface-hover"
        >
          <span className="hidden text-end sm:block">
            <span className="block text-sm font-medium text-fg">{user.fullName}</span>
            <span className="block text-xs text-fg-subtle">{roleLabel}</span>
          </span>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-fg uppercase">
            {initials(user.fullName)}
          </span>
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute end-0 mt-2 w-60 origin-top animate-[scale-in_0.12s_ease-out] overflow-hidden rounded-xl bg-surface-raised shadow-overlay ring-1 ring-border"
          >
            <div className="border-b border-border px-4 py-3">
              <p className="truncate text-sm font-medium text-fg">{user.fullName}</p>
              <p className="truncate text-xs text-fg-muted">{user.email}</p>
            </div>
            <div className="p-1">
              <Link
                href="/me/profile"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
              >
                <User className="size-4" aria-hidden />
                {t("self.myProfile")}
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={signOut}
                disabled={signingOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-soft disabled:opacity-50"
              >
                <LogOut className="size-4" aria-hidden />
                {signingOut ? t("common.loading") : t("auth.logout")}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
