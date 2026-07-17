"use client";

import { ResourceManager } from "@/components/data/ResourceManager";
import type { Column } from "@/components/data/DataTable";
import type { FieldDef } from "@/components/data/ResourceForm";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/i18n/provider";
import { formatCurrency } from "@/lib/utils";
import type { ListResult } from "@/lib/query";
import type { Locale } from "@/i18n/dictionaries";

export interface InventoryRow {
  _id: string;
  name: string;
  sku?: string;
  category?: string;
  quantity: number;
  reorderLevel: number;
  unitCost?: number;
  warehouse?: { name: string } | null;
}

export function InventoryClient({
  initial,
  locale,
  title,
  warehouses,
}: {
  initial: ListResult<InventoryRow>;
  locale: Locale;
  title: string;
  warehouses: { value: string; label: string }[];
}) {
  const { t } = useI18n();

  const columns: Column<InventoryRow>[] = [
    { key: "name", header: locale === "ar" ? "الصنف" : "Item", sortable: true, cell: (r) => <div><p className="font-medium text-fg">{r.name}</p>{r.sku && <p className="text-xs text-fg-muted" dir="ltr">{r.sku}</p>}</div> },
    { key: "category", header: locale === "ar" ? "الفئة" : "Category", hideOnMobile: true, cell: (r) => <span className="text-sm text-fg-muted">{r.category || "—"}</span> },
    { key: "warehouse", header: locale === "ar" ? "المستودع" : "Warehouse", cell: (r) => <span className="text-sm text-fg">{r.warehouse?.name || "—"}</span> },
    {
      key: "quantity",
      header: locale === "ar" ? "الكمية" : "Qty",
      sortable: true,
      align: "center",
      cell: (r) => {
        const low = r.quantity <= r.reorderLevel;
        const out = r.quantity === 0;
        return <Badge tone={out ? "danger" : low ? "warning" : "success"}>{r.quantity}</Badge>;
      },
    },
    { key: "unitCost", header: locale === "ar" ? "تكلفة الوحدة" : "Unit Cost", align: "end", hideOnMobile: true, cell: (r) => <span className="tabular text-sm">{r.unitCost ? formatCurrency(r.unitCost, locale) : "—"}</span> },
  ];

  const fields: FieldDef[] = [
    { key: "name", label: locale === "ar" ? "اسم الصنف" : "Item Name", type: "text", required: true },
    { key: "sku", label: "SKU", type: "text", dir: "ltr" },
    { key: "category", label: locale === "ar" ? "الفئة" : "Category", type: "text" },
    { key: "warehouse", label: locale === "ar" ? "المستودع" : "Warehouse", type: "select", required: true, options: warehouses },
    { key: "quantity", label: locale === "ar" ? "الكمية" : "Quantity", type: "number", dir: "ltr" },
    { key: "reorderLevel", label: locale === "ar" ? "حد إعادة الطلب" : "Reorder Level", type: "number", dir: "ltr" },
    { key: "unitCost", label: locale === "ar" ? "تكلفة الوحدة" : "Unit Cost", type: "number", dir: "ltr" },
    { key: "custodyType", label: locale === "ar" ? "نوع العهدة المرتبط" : "Custody Type", type: "text" },
    { key: "notes", label: t("common.notes"), type: "textarea", span: 2 },
  ];

  return (
    <ResourceManager
      title={title}
      initial={initial}
      columns={columns}
      formFields={fields}
      endpoint="/api/procurement/inventory"
      exportFilename="inventory"
      addLabel={locale === "ar" ? "إضافة صنف" : "Add Item"}
      labelOf={(r) => r.name}
      filters={[{ key: "warehouse", label: locale === "ar" ? "المستودع" : "Warehouse", options: warehouses }]}
    />
  );
}
