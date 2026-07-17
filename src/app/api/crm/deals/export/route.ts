import { exportRoute } from "@/lib/exportFactory";
import { Deal } from "@/models/Deal";
import { dealSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: Deal,
  resource: "crm.deals",
  listSpec: dealSpec,
  sheetName: "Deals",
  titleAr: "الصفقات",
  titleEn: "Deals",
  filenameAr: "الصفقات",
  filenameEn: "deals",
  columns: (): ExcelColumn[] => [
    { key: "title", headerAr: "العنوان", headerEn: "Title", width: 30 },
    { key: "company", headerAr: "الشركة", headerEn: "Company", width: 26, value: (r) => (r.company as { name?: string } | null)?.name ?? "" },
    { key: "stage", headerAr: "المرحلة", headerEn: "Stage", width: 16 },
    { key: "value", headerAr: "القيمة", headerEn: "Value", width: 16, format: "currency" },
    { key: "probability", headerAr: "الاحتمالية", headerEn: "Probability", width: 12, format: "number" },
    { key: "expectedCloseDate", headerAr: "تاريخ الإغلاق المتوقع", headerEn: "Expected Close", width: 18, format: "date" },
  ],
});
