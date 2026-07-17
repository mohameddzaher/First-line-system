import type { Metadata } from "next";
import { Job } from "@/models/Job";
import { loadList } from "@/lib/loadList";
import { jobSpec } from "@/app/api/cms/jobs/route";
import { JobsAdminClient, type JobAdminRow } from "./JobsAdminClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Jobs" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { result, locale } = await loadList(Job, "cms.jobs:read", jobSpec, sp);
  return <JobsAdminClient initial={result as unknown as ListResult<JobAdminRow>} locale={locale} title={locale === "ar" ? "الوظائف" : "Jobs"} />;
}
