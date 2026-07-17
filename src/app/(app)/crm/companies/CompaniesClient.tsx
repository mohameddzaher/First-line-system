"use client";

import { useRouter } from "next/navigation";
import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface CompanyRow {
  _id: string;
  name: string;
  nameAr?: string;
  kind: string;
  status: string;
  city?: string;
  phone?: string;
  email?: string;
}

const KIND = [
  ["customer", "عميل", "Customer", "info"],
  ["vendor", "مورّد", "Vendor", "accent"],
  ["both", "عميل ومورّد", "Both", "success"],
] as const;
const STATUS = [
  ["active", "نشط", "Active", "success"],
  ["prospect", "محتمل", "Prospect", "warning"],
  ["inactive", "غير نشط", "Inactive", "neutral"],
] as const;

export function CompaniesClient({ initial, locale, title }: { initial: ListResult<CompanyRow>; locale: Locale; title: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const meta = (arr: readonly (readonly [string, string, string, string])[], v: string) => arr.find((x) => x[0] === v);

  const columns: Column<CompanyRow>[] = [
    { key: "name", header: t("common.name"), sortable: true, cell: (r) => <div><p className="font-medium text-fg">{r.name}</p>{r.nameAr && <p className="text-xs text-fg-muted">{r.nameAr}</p>}</div> },
    { key: "kind", header: locale === "ar" ? "النوع" : "Kind", cell: (r) => { const m = meta(KIND, r.kind); return <Badge tone={(m?.[3] as never) ?? "neutral"}>{m ? (locale === "ar" ? m[1] : m[2]) : r.kind}</Badge>; } },
    { key: "city", header: locale === "ar" ? "المدينة" : "City", hideOnMobile: true, cell: (r) => <span className="text-sm text-fg-muted">{r.city || "—"}</span> },
    { key: "phone", header: t("common.phone"), hideOnMobile: true, cell: (r) => <span className="text-sm text-fg-muted" dir="ltr">{r.phone || "—"}</span> },
    { key: "status", header: t("common.status"), align: "center", cell: (r) => { const m = meta(STATUS, r.status); return <Badge tone={(m?.[3] as never) ?? "neutral"} dot>{m ? (locale === "ar" ? m[1] : m[2]) : r.status}</Badge>; } },
  ];

  const fields: FieldDef[] = [
    { key: "name", label: locale === "ar" ? "الاسم" : "Name", type: "text", required: true },
    { key: "nameAr", label: locale === "ar" ? "الاسم بالعربية" : "Arabic Name", type: "text" },
    { key: "kind", label: locale === "ar" ? "النوع" : "Kind", type: "select", options: KIND.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
    { key: "status", label: t("common.status"), type: "select", options: STATUS.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
    { key: "industry", label: locale === "ar" ? "القطاع" : "Industry", type: "text" },
    { key: "city", label: locale === "ar" ? "المدينة" : "City", type: "text" },
    { key: "phone", label: t("common.phone"), type: "text", dir: "ltr" },
    { key: "email", label: t("common.email"), type: "email", dir: "ltr" },
    { key: "website", label: locale === "ar" ? "الموقع الإلكتروني" : "Website", type: "text", dir: "ltr" },
    { key: "crNumber", label: locale === "ar" ? "السجل التجاري" : "CR Number", type: "text", dir: "ltr" },
    { key: "vatNumber", label: locale === "ar" ? "الرقم الضريبي" : "VAT Number", type: "text", dir: "ltr" },
    { key: "notes", label: t("common.notes"), type: "textarea", span: 2 },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/crm/companies"
      exportFilename="companies"
      addLabel={locale === "ar" ? "إضافة شركة" : "Add Company"}
      labelOf={(r) => r.name}
      rowHref={(r) => `/crm/companies/${r._id}`}
      filters={[
        { key: "kind", label: locale === "ar" ? "النوع" : "Kind", options: KIND.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
        { key: "status", label: t("common.status"), options: STATUS.map((x) => ({ value: x[0], label: locale === "ar" ? x[1] : x[2] })) },
      ]}
    />
  );
}
