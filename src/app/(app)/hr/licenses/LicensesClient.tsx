"use client";

import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import { formatDate, daysUntil } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";
import type { LicenseRow } from "./page";

export function LicensesClient({
  initial,
  locale,
  title,
}: {
  initial: ListResult<LicenseRow>;
  locale: Locale;
  title: string;
}) {
  const { t } = useI18n();

  const expiryBadge = (date: string) => {
    const days = daysUntil(date);
    if (days === null) return <span className="text-fg-subtle">—</span>;
    if (days < 0) return <Badge tone="danger">{t("common.expired")}</Badge>;
    if (days <= 60) return <Badge tone="warning">{days} {t("common.daysLeft")}</Badge>;
    return <Badge tone="success">{days} {t("common.daysLeft")}</Badge>;
  };

  const columns: Column<LicenseRow>[] = [
    { key: "category", header: locale === "ar" ? "الفئة" : "Category", sortable: true, cell: (r) => <span className="text-sm text-fg-muted">{r.category}</span> },
    { key: "name", header: locale === "ar" ? "الترخيص / الاشتراك" : "License / Subscription", sortable: true, cell: (r) => <span className="font-medium text-fg">{r.name}</span> },
    { key: "durationLabel", header: locale === "ar" ? "المدة" : "Duration", hideOnMobile: true, cell: (r) => <span className="text-sm text-fg-muted">{r.durationLabel || "—"}</span> },
    { key: "expiryDate", header: locale === "ar" ? "تاريخ الانتهاء" : "Expiry Date", sortable: true, cell: (r) => <span className="tabular text-sm">{formatDate(r.expiryDate)}</span> },
    { key: "location", header: locale === "ar" ? "الموقع" : "Location", hideOnMobile: true, cell: (r) => <span className="text-sm text-fg">{r.location || "—"}</span> },
    { key: "daysLeft", header: locale === "ar" ? "المتبقي" : "Days Left", align: "center", cell: (r) => expiryBadge(r.expiryDate) },
  ];

  const fields: FieldDef[] = [
    { key: "name", label: locale === "ar" ? "الاسم" : "Name", type: "text", required: true, span: 2 },
    { key: "category", label: locale === "ar" ? "الفئة" : "Category", type: "text", required: true },
    { key: "durationLabel", label: locale === "ar" ? "المدة" : "Duration", type: "text" },
    { key: "issueDate", label: locale === "ar" ? "تاريخ الإصدار" : "Issue Date", type: "date" },
    { key: "expiryDate", label: locale === "ar" ? "تاريخ الانتهاء" : "Expiry Date", type: "date", required: true },
    { key: "location", label: locale === "ar" ? "الموقع" : "Location", type: "text" },
    { key: "number", label: locale === "ar" ? "الرقم" : "Number", type: "text", dir: "ltr" },
    { key: "notes", label: t("common.notes"), type: "textarea", span: 2 },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/hr/licenses"
      exportFilename="licenses"
      addLabel={locale === "ar" ? "إضافة ترخيص" : "Add License"}
      labelOf={(r) => r.name}
      dateField={{ key: "expiryDate", label: locale === "ar" ? "تاريخ الانتهاء" : "Expiry Date" }}
    />
  );
}
