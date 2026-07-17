"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, Languages, Sun, Moon, LogIn } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

export function SiteHeader({ brand }: { brand: string }) {
  const { locale, setLocale } = useI18n();
  const { resolved, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = [
    { href: "/", ar: "الرئيسية", en: "Home" },
    { href: "/services", ar: "خدماتنا", en: "Services" },
    { href: "/about", ar: "من نحن", en: "About" },
    { href: "/articles", ar: "المقالات", en: "Articles" },
    { href: "/careers", ar: "الوظائف", en: "Careers" },
    { href: "/contact", ar: "تواصل معنا", en: "Contact" },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "bg-surface/90 shadow-card backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-fg">FL</span>
          <span className={cn("text-lg font-bold transition-colors", scrolled ? "text-fg" : "text-fg")}>{brand}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg">
              {locale === "ar" ? n.ar : n.en}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button onClick={() => setLocale(locale === "ar" ? "en" : "ar")} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg" aria-label="Language">
            <Languages className="size-4" aria-hidden />
            <span className="hidden sm:inline">{locale === "ar" ? "EN" : "عربي"}</span>
          </button>
          <button onClick={() => setTheme(resolved === "dark" ? "light" : "dark")} className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg" aria-label="Theme">
            {resolved === "dark" ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
          </button>
          <Link href="/login" className="hidden items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-fg shadow-sm transition-transform hover:bg-primary-hover active:translate-y-px sm:inline-flex">
            <LogIn className="size-4" aria-hidden />
            {locale === "ar" ? "دخول النظام" : "Sign in"}
          </Link>
          <button onClick={() => setOpen(!open)} className="rounded-lg p-2 text-fg-muted hover:bg-surface-hover lg:hidden" aria-label="Menu">
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-surface lg:hidden">
          <nav className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-fg-muted hover:bg-surface-hover hover:text-fg">
                {locale === "ar" ? n.ar : n.en}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className="mt-2 block rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-fg">
              {locale === "ar" ? "دخول النظام" : "Sign in"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
