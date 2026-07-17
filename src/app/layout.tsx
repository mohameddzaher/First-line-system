import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { getLocale, getTheme } from "@/i18n/server";
import { dirFor } from "@/i18n/dictionaries";
import { I18nProvider } from "@/i18n/provider";
import { ThemeProvider, themeScript } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";

/**
 * IBM Plex Sans Arabic covers Arabic and Latin in one family with real,
 * readable letterforms — not a display face. One font, both locales, so nothing
 * shifts when the UI switches language.
 */
const appFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-app-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "First Line — Logistics & Delivery",
    template: "%s | First Line",
  },
  description:
    "First Line delivers last-mile logistics across Saudi Arabia with a fleet of over 1,500 riders and drivers.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1420" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);

  return (
    <html lang={locale} dir={dirFor(locale)} suppressHydrationWarning>
      <head>
        {/* Applies the theme class before first paint so dark users see no flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${appFont.variable} min-h-dvh antialiased`}>
        <ThemeProvider initialTheme={theme}>
          <I18nProvider locale={locale}>
            <ToastProvider>
              <ConfirmProvider>{children}</ConfirmProvider>
            </ToastProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
