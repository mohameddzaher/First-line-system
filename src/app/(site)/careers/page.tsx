import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { getLocale } from "@/i18n/server";
import { Job } from "@/models/Job";
import { serialize } from "@/lib/serialize";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { MapPin, Briefcase } from "lucide-react";

export const metadata: Metadata = { title: "Careers" };
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, [string, string]> = {
  full_time: ["دوام كامل", "Full Time"],
  part_time: ["دوام جزئي", "Part Time"],
  contract: ["عقد", "Contract"],
  freelance: ["عمل حر", "Freelance"],
};

export default async function CareersPage() {
  await connectDB();
  const [locale, jobs] = await Promise.all([getLocale(), Job.find({ published: true }).sort({ createdAt: -1 }).lean()]);
  const ar = locale === "ar";
  const list = serialize(jobs) as unknown as Record<string, unknown>[];

  return (
    <>
      <PageHero title={ar ? "الوظائف" : "Careers"} subtitle={ar ? "انضم إلى فريق الخط الأول وكن جزءًا من نمونا" : "Join the First Line team and be part of our growth"} />
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        {list.length === 0 ? (
          <p className="text-center text-fg-muted">{ar ? "لا توجد وظائف شاغرة حاليًا." : "No open positions at the moment."}</p>
        ) : (
          <div className="space-y-4">
            {list.map((j, i) => (
              <Reveal key={String(j._id)} delay={i * 60}>
                <div className="rounded-2xl bg-surface p-6 ring-1 ring-border shadow-card transition-shadow hover:shadow-raised">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-fg">{ar ? (j.title_ar as string) : (j.title_en as string)}</h3>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-fg-muted">
                        {j.department ? <span className="flex items-center gap-1.5"><Briefcase className="size-4" aria-hidden />{j.department as string}</span> : null}
                        {(ar ? j.location_ar : j.location_en) ? <span className="flex items-center gap-1.5"><MapPin className="size-4" aria-hidden />{ar ? (j.location_ar as string) : (j.location_en as string)}</span> : null}
                        <span className="rounded-full bg-bg-subtle px-2.5 py-0.5 text-xs">{TYPE_LABEL[j.type as string]?.[ar ? 0 : 1] ?? (j.type as string)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-fg-muted">{ar ? (j.description_ar as string) : (j.description_en as string)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
