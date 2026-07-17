import type { Metadata } from "next";
import { Project } from "@/models/Project";
import { loadList } from "@/lib/loadList";
import { projectSpec } from "@/app/api/ops/projects/route";
import { getT } from "@/i18n/server";
import { ProjectsClient, type ProjectRow } from "./ProjectsClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const { result, locale } = await loadList(Project, "ops.projects:read", projectSpec, sp);
  const t = await getT();
  return (
    <ProjectsClient
      initial={result as unknown as ListResult<ProjectRow>}
      locale={locale}
      title={locale === "ar" ? "المشاريع" : "Projects"}
    />
  );
}
