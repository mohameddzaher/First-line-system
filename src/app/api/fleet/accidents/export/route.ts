import { exportRoute } from "@/lib/exportFactory";
import { Accident } from "@/models/Accident";
import { accidentSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: Accident,
  resource: "fleet.accidents",
  listSpec: accidentSpec,
  sheetName: "Accidents",
  titleAr: "الحوادث",
  titleEn: "Accidents",
  filenameAr: "الحوادث",
  filenameEn: "accidents",
  columns: (): ExcelColumn[] => [
    { key: "date", headerAr: "التاريخ", headerEn: "Date", width: 16, format: "date" },
    {
      key: "vehicle",
      headerAr: "رقم اللوحة",
      headerEn: "Plate Number",
      width: 18,
      value: (r) => (r.vehicle as { plateNumber?: string } | null)?.plateNumber ?? "",
    },
    {
      key: "employee",
      headerAr: "الموظف",
      headerEn: "Employee",
      width: 24,
      value: (r) => (r.employee as { nameAr?: string } | null)?.nameAr ?? "",
    },
    { key: "severity", headerAr: "الجسامة", headerEn: "Severity", width: 14 },
    { key: "atFault", headerAr: "الخطأ", headerEn: "At Fault", width: 14 },
    { key: "status", headerAr: "الحالة", headerEn: "Status", width: 14 },
    { key: "estimatedCost", headerAr: "التكلفة المقدرة", headerEn: "Est. Cost", width: 16, format: "currency" },
    { key: "actualCost", headerAr: "التكلفة الفعلية", headerEn: "Actual Cost", width: 16, format: "currency" },
  ],
});
