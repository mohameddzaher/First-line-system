"use client";

import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface ClientAdminRow {
  _id: string;
  name: string;
  logo: string;
  website?: string;
  order: number;
  active: boolean;
}

export function ClientsAdminClient({ initial, locale, title }: { initial: ListResult<ClientAdminRow>; locale: Locale; title: string }) {
  const { t } = useI18n();

  const columns: Column<ClientAdminRow>[] = [
    { key: "logo", header: locale === "ar" ? "الشعار" : "Logo", cell: (r) => <img src={r.logo} alt={r.name} className="h-8 w-auto max-w-[120px] object-contain" /> },
    { key: "name", header: t("common.name"), sortable: true, cell: (r) => <span className="font-medium text-fg">{r.name}</span> },
    { key: "order", header: locale === "ar" ? "الترتيب" : "Order", align: "center", sortable: true, cell: (r) => <span className="tabular text-sm text-fg-muted">{r.order}</span> },
    { key: "active", header: t("common.status"), align: "center", cell: (r) => <Badge tone={r.active ? "success" : "neutral"} dot>{r.active ? (locale === "ar" ? "ظاهر" : "Visible") : locale === "ar" ? "مخفي" : "Hidden"}</Badge> },
  ];

  const fields: FieldDef[] = [
    { key: "name", label: t("common.name"), type: "text", required: true },
    { key: "logo", label: locale === "ar" ? "رابط الشعار أو Data URI" : "Logo URL or Data URI", type: "text", required: true, dir: "ltr", span: 2, hint: locale === "ar" ? "الصق رابط صورة الشعار" : "Paste the logo image URL" },
    { key: "website", label: locale === "ar" ? "الموقع الإلكتروني" : "Website", type: "text", dir: "ltr" },
    { key: "order", label: locale === "ar" ? "الترتيب" : "Order", type: "number", dir: "ltr" },
    { key: "active", label: locale === "ar" ? "ظاهر" : "Visible", type: "checkbox" },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/cms/clients"
      exportFilename="clients"
      addLabel={locale === "ar" ? "إضافة عميل" : "Add Client"}
      labelOf={(r) => r.name}
    />
  );
}
