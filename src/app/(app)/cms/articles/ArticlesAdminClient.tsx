"use client";

import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import { formatDate } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface ArticleAdminRow {
  _id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  published: boolean;
  publishedAt?: string;
  views: number;
}

export function ArticlesAdminClient({ initial, locale, title }: { initial: ListResult<ArticleAdminRow>; locale: Locale; title: string }) {
  const { t } = useI18n();

  const columns: Column<ArticleAdminRow>[] = [
    { key: "title", header: t("common.name"), sortable: true, cell: (r) => <div><p className="font-medium text-fg">{locale === "ar" ? r.title_ar : r.title_en}</p><p className="font-mono text-xs text-fg-subtle" dir="ltr">/{r.slug}</p></div> },
    { key: "views", header: locale === "ar" ? "المشاهدات" : "Views", align: "center", sortable: true, cell: (r) => <span className="tabular text-sm text-fg-muted">{r.views}</span> },
    { key: "publishedAt", header: locale === "ar" ? "تاريخ النشر" : "Published", hideOnMobile: true, cell: (r) => <span className="tabular text-sm">{r.publishedAt ? formatDate(r.publishedAt) : "—"}</span> },
    { key: "published", header: t("common.status"), align: "center", cell: (r) => <Badge tone={r.published ? "success" : "neutral"} dot>{r.published ? (locale === "ar" ? "منشور" : "Published") : locale === "ar" ? "مسودة" : "Draft"}</Badge> },
  ];

  const fields: FieldDef[] = [
    { key: "slug", label: locale === "ar" ? "المعرّف (slug)" : "Slug", type: "text", required: true, dir: "ltr", hint: locale === "ar" ? "أحرف إنجليزية وأرقام وشرطات فقط" : "lowercase letters, numbers, dashes" },
    { key: "title_ar", label: locale === "ar" ? "العنوان (عربي)" : "Title (AR)", type: "text", required: true },
    { key: "title_en", label: locale === "ar" ? "العنوان (إنجليزي)" : "Title (EN)", type: "text", required: true, dir: "ltr" },
    { key: "excerpt_ar", label: locale === "ar" ? "المقتطف (عربي)" : "Excerpt (AR)", type: "textarea" },
    { key: "excerpt_en", label: locale === "ar" ? "المقتطف (إنجليزي)" : "Excerpt (EN)", type: "textarea" },
    { key: "body_ar", label: locale === "ar" ? "المحتوى (عربي)" : "Body (AR)", type: "textarea", span: 2 },
    { key: "body_en", label: locale === "ar" ? "المحتوى (إنجليزي)" : "Body (EN)", type: "textarea", span: 2 },
    { key: "published", label: locale === "ar" ? "منشور" : "Published", type: "checkbox" },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/cms/articles"
      exportFilename="articles"
      addLabel={locale === "ar" ? "مقال جديد" : "New Article"}
      labelOf={(r) => (locale === "ar" ? r.title_ar : r.title_en)}
      filters={[{ key: "published", label: t("common.status"), options: [{ value: "true", label: locale === "ar" ? "منشور" : "Published" }, { value: "false", label: locale === "ar" ? "مسودة" : "Draft" }] }]}
    />
  );
}
