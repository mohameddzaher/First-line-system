import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Submission } from "@/models/Submission";
import { runListQuery } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import { serialize } from "@/lib/serialize";
import { submissionSpec } from "@/app/api/cms/submissions/route";
import { SubmissionsClient, type SubmissionRow } from "./SubmissionsClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Submissions" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requirePermission("cms.submissions:read");
  await connectDB();
  const [locale, sp] = await Promise.all([getLocale(), searchParams]);
  const query = parseListQuery(new URLSearchParams(sp));
  const result = await runListQuery(Submission, query, submissionSpec);

  return (
    <SubmissionsClient
      initial={serialize(result) as unknown as ListResult<SubmissionRow>}
      locale={locale}
      title={locale === "ar" ? "الرسائل الواردة" : "Submissions"}
    />
  );
}
