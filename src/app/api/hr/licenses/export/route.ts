import { exportRoute } from "@/lib/exportFactory";
import { License } from "@/models/License";
import { licenseSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: License,
  resource: "hr.licenses",
  listSpec: licenseSpec,
  sheetName: "Licenses",
  titleAr: "التراخيص والاشتراكات",
  titleEn: "Licenses & Subscriptions",
  filenameAr: "التراخيص",
  filenameEn: "licenses",
  columns: (): ExcelColumn[] => [
    { key: "category", headerAr: "الفئة", headerEn: "Category", width: 22 },
    { key: "name", headerAr: "الاسم", headerEn: "Name", width: 30 },
    { key: "durationLabel", headerAr: "المدة", headerEn: "Duration", width: 14 },
    { key: "expiryDate", headerAr: "تاريخ الانتهاء", headerEn: "Expiry Date", width: 16, format: "date" },
    { key: "location", headerAr: "الموقع", headerEn: "Location", width: 18 },
    { key: "number", headerAr: "الرقم", headerEn: "Number", width: 18 },
  ],
});
