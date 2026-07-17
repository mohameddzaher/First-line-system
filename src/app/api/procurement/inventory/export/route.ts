import { exportRoute } from "@/lib/exportFactory";
import { InventoryItem } from "@/models/InventoryItem";
import { inventoryItemSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: InventoryItem,
  resource: "procurement.inventory",
  listSpec: inventoryItemSpec,
  sheetName: "Inventory",
  titleAr: "المخزون",
  titleEn: "Inventory",
  filenameAr: "المخزون",
  filenameEn: "inventory",
  columns: (): ExcelColumn[] => [
    { key: "name", headerAr: "الصنف", headerEn: "Item", width: 28 },
    { key: "sku", headerAr: "الرمز", headerEn: "SKU", width: 16 },
    { key: "category", headerAr: "الفئة", headerEn: "Category", width: 18 },
    { key: "warehouse", headerAr: "المستودع", headerEn: "Warehouse", width: 20, value: (r) => (r.warehouse as { name?: string } | null)?.name ?? "" },
    { key: "quantity", headerAr: "الكمية", headerEn: "Qty", width: 12, format: "number" },
    { key: "reorderLevel", headerAr: "حد إعادة الطلب", headerEn: "Reorder", width: 14, format: "number" },
    { key: "unitCost", headerAr: "تكلفة الوحدة", headerEn: "Unit Cost", width: 14, format: "currency" },
  ],
});
