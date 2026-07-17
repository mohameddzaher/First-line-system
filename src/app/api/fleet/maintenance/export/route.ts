import { exportRoute } from "@/lib/exportFactory";
import { Maintenance } from "@/models/Maintenance";
import { maintenanceSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: Maintenance,
  resource: "fleet.maintenance",
  listSpec: maintenanceSpec,
  sheetName: "Maintenance",
  titleAr: "الصيانة",
  titleEn: "Maintenance",
  filenameAr: "الصيانة",
  filenameEn: "maintenance",
  columns: (): ExcelColumn[] => [
    { key: "date", headerAr: "التاريخ", headerEn: "Date", width: 16, format: "date" },
    { key: "vehicle", headerAr: "رقم اللوحة", headerEn: "Plate", width: 16, value: (r) => (r.vehicle as { plateNumber?: string } | null)?.plateNumber ?? "" },
    { key: "type", headerAr: "النوع", headerEn: "Type", width: 16 },
    { key: "status", headerAr: "الحالة", headerEn: "Status", width: 14 },
    { key: "workshop", headerAr: "الورشة", headerEn: "Workshop", width: 20 },
    { key: "odometer", headerAr: "العداد", headerEn: "Odometer", width: 12, format: "number" },
    { key: "cost", headerAr: "التكلفة", headerEn: "Cost", width: 14, format: "currency" },
  ],
});
