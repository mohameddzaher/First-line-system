import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/siteContent";
import { getLocale } from "@/i18n/server";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { FaqList } from "@/components/site/FaqList";
import { MessageCircleQuestion } from "lucide-react";

export const metadata: Metadata = { title: "FAQ" };
export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const [s, locale] = await Promise.all([getSiteSettings(), getLocale()]);
  const ar = locale === "ar";

  // Content is authored in the CMS (Site Settings → FAQs), so this page is
  // entirely driven by what the super admin publishes.
  const faqs = (s.faqs ?? []).map((f) => ({
    q: ar ? f.q_ar : f.q_en,
    a: ar ? f.a_ar : f.a_en,
  }));

  return (
    <>
      <PageHero
        title={ar ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
        subtitle={
          ar
            ? "إجابات عن أكثر ما يُسأل عنه بشأن خدماتنا وطريقة عملنا."
            : "Answers to what we're asked most about our services and how we work."
        }
      />

      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        {faqs.length === 0 ? (
          <Reveal>
            <div className="rounded-2xl bg-surface p-10 text-center ring-1 ring-border">
              <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageCircleQuestion className="size-6" aria-hidden />
              </span>
              <p className="mt-4 text-fg-muted">
                {ar ? "لا توجد أسئلة منشورة حالياً." : "No questions published yet."}
              </p>
            </div>
          </Reveal>
        ) : (
          <Reveal>
            <FaqList faqs={faqs} />
          </Reveal>
        )}

        <Reveal delay={150}>
          <div className="mt-12 rounded-2xl bg-primary/5 p-8 text-center ring-1 ring-primary/15">
            <h2 className="text-lg font-bold text-fg">
              {ar ? "لم تجد إجابتك؟" : "Didn't find your answer?"}
            </h2>
            <p className="mt-2 text-sm text-fg-muted">
              {ar
                ? "تواصل معنا وسيرد عليك فريقنا في أقرب وقت."
                : "Get in touch and our team will get back to you shortly."}
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-flex items-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              {ar ? "تواصل معنا" : "Contact us"}
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
