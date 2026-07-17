"use client";

import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface ProjectRow {
  _id: string;
  nameAr: string;
  nameEn?: string;
  code?: string;
  isActive: boolean;
}

export function ProjectsClient({
  initial,
  locale,
  title,
}: {
  initial: ListResult<ProjectRow>;
  locale: Locale;
  title: string;
}) {
  const { t } = useI18n();

  const columns: Column<ProjectRow>[] = [
    { key: "nameAr", header: t("common.name"), sortable: true, cell: (r) => <span className="font-medium text-fg">{locale === "ar" ? r.nameAr : r.nameEn ?? r.nameAr}</span> },
    { key: "code", header: locale === "ar" ? "الرمز" : "Code", cell: (r) => <span className="font-mono text-xs text-fg-muted">{r.code || "—"}</span> },
    { key: "isActive", header: t("common.status"), align: "center", cell: (r) => <Badge tone={r.isActive ? "success" : "neutral"} dot>{r.isActive ? (locale === "ar" ? "نشط" : "Active") : locale === "ar" ? "معطّل" : "Inactive"}</Badge> },
  ];

  const fields: FieldDef[] = [
    { key: "nameAr", label: locale === "ar" ? "الاسم بالعربية" : "Arabic Name", type: "text", required: true },
    { key: "nameEn", label: locale === "ar" ? "الاسم بالإنجليزية" : "English Name", type: "text", dir: "ltr" },
    { key: "code", label: locale === "ar" ? "الرمز" : "Code", type: "text", dir: "ltr" },
    { key: "isActive", label: locale === "ar" ? "نشط" : "Active", type: "checkbox" },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/ops/projects"
      exportFilename="projects"
      addLabel={locale === "ar" ? "إضافة مشروع" : "Add Project"}
      labelOf={(r) => r.nameAr}
    />
  );
}
