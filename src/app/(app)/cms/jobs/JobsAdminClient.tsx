"use client";

import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface JobAdminRow {
  _id: string;
  title_ar: string;
  title_en: string;
  department?: string;
  type: string;
  published: boolean;
}

const TYPES = [
  ["full_time", "دوام كامل", "Full Time"],
  ["part_time", "دوام جزئي", "Part Time"],
  ["contract", "عقد", "Contract"],
  ["freelance", "عمل حر", "Freelance"],
] as const;

export function JobsAdminClient({ initial, locale, title }: { initial: ListResult<JobAdminRow>; locale: Locale; title: string }) {
  const { t } = useI18n();
  const typeLabel = (v: string) => { const f = TYPES.find((x) => x[0] === v); return f ? (locale === "ar" ? f[1] : f[2]) : v; };

  const columns: Column<JobAdminRow>[] = [
    { key: "title", header: t("common.name"), sortable: true, cell: (r) => <span className="font-medium text-fg">{locale === "ar" ? r.title_ar : r.title_en}</span> },
    { key: "department", header: locale === "ar" ? "القسم" : "Department", hideOnMobile: true, cell: (r) => <span className="text-sm text-fg-muted">{r.department || "—"}</span> },
    { key: "type", header: t("common.type"), cell: (r) => <span className="text-sm text-fg-muted">{typeLabel(r.type)}</span> },
    { key: "published", header: t("common.status"), align: "center", cell: (r) => <Badge tone={r.published ? "success" : "neutral"} dot>{r.published ? (locale === "ar" ? "منشور" : "Published") : locale === "ar" ? "مخفي" : "Hidden"}</Badge> },
  ];

  const fields: FieldDef[] = [
    { key: "title_ar", label: locale === "ar" ? "المسمى (عربي)" : "Title (AR)", type: "text", required: true },
    { key: "title_en", label: locale === "ar" ? "المسمى (إنجليزي)" : "Title (EN)", type: "text", required: true, dir: "ltr" },
    { key: "department", label: locale === "ar" ? "القسم" : "Department", type: "text" },
    { key: "type", label: t("common.type"), type: "select", options: TYPES.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
    { key: "location_ar", label: locale === "ar" ? "الموقع (عربي)" : "Location (AR)", type: "text" },
    { key: "location_en", label: locale === "ar" ? "الموقع (إنجليزي)" : "Location (EN)", type: "text" },
    { key: "description_ar", label: locale === "ar" ? "الوصف (عربي)" : "Description (AR)", type: "textarea", span: 2 },
    { key: "description_en", label: locale === "ar" ? "الوصف (إنجليزي)" : "Description (EN)", type: "textarea", span: 2 },
    { key: "published", label: locale === "ar" ? "منشور" : "Published", type: "checkbox" },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/cms/jobs"
      exportFilename="jobs"
      addLabel={locale === "ar" ? "وظيفة جديدة" : "New Job"}
      labelOf={(r) => (locale === "ar" ? r.title_ar : r.title_en)}
    />
  );
}
