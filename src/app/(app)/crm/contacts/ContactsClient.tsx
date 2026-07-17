"use client";

import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface ContactRow { _id: string; name: string; title?: string; email?: string; phone?: string; company?: { name: string } | null; }

export function ContactsClient({ initial, locale, title, companies }: { initial: ListResult<ContactRow>; locale: Locale; title: string; companies: { value: string; label: string }[] }) {
  const { t } = useI18n();
  const columns: Column<ContactRow>[] = [
    { key: "name", header: t("common.name"), sortable: true, cell: (r) => <span className="font-medium text-fg">{r.name}</span> },
    { key: "company", header: locale === "ar" ? "الشركة" : "Company", cell: (r) => <span className="text-sm text-fg-muted">{r.company?.name || "—"}</span> },
    { key: "title", header: locale === "ar" ? "المسمى" : "Title", hideOnMobile: true, cell: (r) => <span className="text-sm text-fg">{r.title || "—"}</span> },
    { key: "email", header: t("common.email"), hideOnMobile: true, cell: (r) => <span className="text-sm text-fg-muted" dir="ltr">{r.email || "—"}</span> },
    { key: "phone", header: t("common.phone"), hideOnMobile: true, cell: (r) => <span className="text-sm text-fg-muted" dir="ltr">{r.phone || "—"}</span> },
  ];
  const fields: FieldDef[] = [
    { key: "name", label: t("common.name"), type: "text", required: true },
    { key: "company", label: locale === "ar" ? "الشركة" : "Company", type: "select", options: companies },
    { key: "title", label: locale === "ar" ? "المسمى الوظيفي" : "Title", type: "text" },
    { key: "email", label: t("common.email"), type: "email", dir: "ltr" },
    { key: "phone", label: t("common.phone"), type: "text", dir: "ltr" },
  ];
  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/crm/contacts"
      exportFilename="contacts"
      addLabel={locale === "ar" ? "إضافة جهة اتصال" : "Add Contact"}
      labelOf={(r) => (r as { name?: string }).name ?? ""}
    />
  );
}
