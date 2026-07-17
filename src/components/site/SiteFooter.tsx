"use client";

import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/i18n/provider";
import { useToast } from "@/components/ui/Toast";

interface FooterData {
  brand: string;
  tagline: string;
  phones: string[];
  emails: string[];
  address: string;
  social: { platform: string; url: string }[];
}

export function SiteFooter({ data }: { data: FooterData }) {
  const { locale } = useI18n();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const links = [
    { href: "/services", ar: "خدماتنا", en: "Services" },
    { href: "/about", ar: "من نحن", en: "About Us" },
    { href: "/articles", ar: "المقالات", en: "Articles" },
    { href: "/careers", ar: "الوظائف", en: "Careers" },
    { href: "/contact", ar: "تواصل معنا", en: "Contact" },
    { href: "/privacy", ar: "سياسة الخصوصية", en: "Privacy Policy" },
    { href: "/terms", ar: "الشروط والأحكام", en: "Terms & Conditions" },
  ];

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    try {
      const res = await fetch("/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast.success(locale === "ar" ? "تم الاشتراك بنجاح" : "Subscribed successfully");
        setEmail("");
      } else toast.error(locale === "ar" ? "تعذّر الاشتراك" : "Subscription failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <footer className="bg-primary text-primary-fg">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary-fg/10 text-sm font-bold ring-1 ring-primary-fg/20">FL</span>
              <span className="text-lg font-bold">{data.brand}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-primary-fg/70">{data.tagline}</p>
            <div className="mt-5 flex gap-2">
              {data.social.map((s) => (
                <a key={s.platform} href={s.url} className="flex size-9 items-center justify-center rounded-lg bg-primary-fg/10 text-xs uppercase ring-1 ring-primary-fg/20 transition-colors hover:bg-primary-fg/20" aria-label={s.platform}>
                  {s.platform.slice(0, 2)}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{locale === "ar" ? "روابط سريعة" : "Quick Links"}</h3>
            <ul className="mt-4 space-y-2.5">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-primary-fg/70 transition-colors hover:text-primary-fg">
                    {locale === "ar" ? l.ar : l.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{locale === "ar" ? "تواصل معنا" : "Get in touch"}</h3>
            <ul className="mt-4 space-y-3 text-sm text-primary-fg/70">
              {data.phones.map((p) => (
                <li key={p} className="flex items-center gap-2.5"><Phone className="size-4 shrink-0" aria-hidden /><span dir="ltr">{p}</span></li>
              ))}
              {data.emails.map((em) => (
                <li key={em} className="flex items-center gap-2.5"><Mail className="size-4 shrink-0" aria-hidden /><span dir="ltr">{em}</span></li>
              ))}
              <li className="flex items-start gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /><span>{data.address}</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{locale === "ar" ? "النشرة البريدية" : "Newsletter"}</h3>
            <p className="mt-4 text-sm text-primary-fg/70">{locale === "ar" ? "اشترك ليصلك كل جديد." : "Subscribe for updates."}</p>
            <form onSubmit={subscribe} className="mt-4 flex gap-2">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={locale === "ar" ? "بريدك الإلكتروني" : "Your email"} dir="ltr" className="h-10 min-w-0 flex-1 rounded-lg bg-primary-fg/10 px-3 text-sm text-primary-fg placeholder:text-primary-fg/50 ring-1 ring-primary-fg/20 focus:ring-2 focus:ring-accent focus:outline-none" />
              <button type="submit" disabled={busy} className="rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg transition-transform hover:brightness-105 active:translate-y-px disabled:opacity-50">
                {locale === "ar" ? "اشترك" : "Join"}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 border-t border-primary-fg/15 pt-6 text-center text-xs text-primary-fg/60">
          © {new Date().getFullYear()} {data.brand}. {locale === "ar" ? "جميع الحقوق محفوظة." : "All rights reserved."}
        </div>
      </div>
    </footer>
  );
}
