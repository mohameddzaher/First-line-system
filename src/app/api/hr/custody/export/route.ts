import { exportRoute } from "@/lib/exportFactory";
import { Custody } from "@/models/Custody";
import { custodySpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: Custody,
  resource: "hr.custody",
  listSpec: custodySpec,
  sheetName: "Custody",
  titleAr: "العهد",
  titleEn: "Custody",
  filenameAr: "العهد",
  filenameEn: "custody",
  columns: (): ExcelColumn[] => [
    { key: "name", headerAr: "الصنف", headerEn: "Item", width: 26 },
    { key: "type", headerAr: "النوع", headerEn: "Type", width: 16 },
    { key: "brand", headerAr: "الماركة", headerEn: "Brand", width: 16 },
    { key: "serial", headerAr: "الرقم التسلسلي", headerEn: "Serial", width: 20 },
    {
      key: "employee",
      headerAr: "الموظف",
      headerEn: "Employee",
      width: 26,
      value: (r) => (r.employee as { nameAr?: string } | null)?.nameAr ?? "",
    },
    { key: "status", headerAr: "الحالة", headerEn: "Status", width: 14 },
    { key: "assignedDate", headerAr: "تاريخ التسليم", headerEn: "Assigned", width: 16, format: "date" },
  ],
});
