import { exportRoute } from "@/lib/exportFactory";
import { Warehouse } from "@/models/Warehouse";
import { warehouseSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: Warehouse,
  resource: "procurement.warehouses",
  listSpec: warehouseSpec,
  sheetName: "Warehouses",
  titleAr: "المستودعات",
  titleEn: "Warehouses",
  filenameAr: "المستودعات",
  filenameEn: "warehouses",
  columns: (): ExcelColumn[] => [
    { key: "name", headerAr: "الاسم", headerEn: "Name", width: 26 },
    { key: "location", headerAr: "الموقع", headerEn: "Location", width: 24 },
    { key: "isActive", headerAr: "نشط", headerEn: "Active", width: 12, value: (r) => (r.isActive ? "Yes" : "No") },
  ],
});
