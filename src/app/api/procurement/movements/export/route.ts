import { exportRoute } from "@/lib/exportFactory";
import { StockMovement } from "@/models/StockMovement";
import { movementSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: StockMovement,
  resource: "procurement.movements",
  listSpec: movementSpec,
  sheetName: "Stock Movements",
  titleAr: "حركة المخزون",
  titleEn: "Stock Movements",
  filenameAr: "حركة-المخزون",
  filenameEn: "stock-movements",
  columns: (): ExcelColumn[] => [
    { key: "createdAt", headerAr: "التاريخ", headerEn: "Date", width: 18, format: "datetime" },
    { key: "item", headerAr: "الصنف", headerEn: "Item", width: 26, value: (r) => (r.item as { name?: string } | null)?.name ?? "" },
    { key: "type", headerAr: "النوع", headerEn: "Type", width: 14 },
    { key: "delta", headerAr: "التغيّر", headerEn: "Delta", width: 12, format: "number" },
    { key: "balanceAfter", headerAr: "الرصيد بعد", headerEn: "Balance", width: 12, format: "number" },
    { key: "reason", headerAr: "السبب", headerEn: "Reason", width: 26 },
  ],
});
