"use client";

import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface WarehouseRow { _id: string; name: string; location?: string; isActive: boolean; }

export function WarehousesClient({ initial, locale, title,  }: { initial: ListResult<WarehouseRow>; locale: Locale; title: string;  }) {
  const { t } = useI18n();
  const columns: Column<WarehouseRow>[] = [
    { key: "name", header: t("common.name"), sortable: true, cell: (r) => <span className="font-medium text-fg">{r.name}</span> },
    { key: "location", header: locale === "ar" ? "الموقع" : "Location", cell: (r) => <span className="text-sm text-fg-muted">{r.location || "—"}</span> },
    { key: "isActive", header: t("common.status"), align: "center", cell: (r) => <Badge tone={r.isActive ? "success" : "neutral"} dot>{r.isActive ? (locale==="ar"?"نشط":"Active") : (locale==="ar"?"معطّل":"Inactive")}</Badge> },
  ];
  const fields: FieldDef[] = [
    { key: "name", label: t("common.name"), type: "text", required: true },
    { key: "location", label: locale === "ar" ? "الموقع" : "Location", type: "text" },
    { key: "isActive", label: locale === "ar" ? "نشط" : "Active", type: "checkbox" },
  ];
  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/procurement/warehouses"
      exportFilename="warehouses"
      addLabel={locale === "ar" ? "إضافة مستودع" : "Add Warehouse"}
      labelOf={(r) => (r as { name?: string }).name ?? ""}
    />
  );
}
