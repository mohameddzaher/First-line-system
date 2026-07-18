import { exportRoute } from "@/lib/exportFactory";
import { Department } from "@/models/Department";
import { departmentSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: Department,
  resource: "hr.departments",
  listSpec: departmentSpec,
  sheetName: "Departments",
  titleAr: "الإدارات",
  titleEn: "Departments",
  filenameAr: "الإدارات",
  filenameEn: "departments",
  columns: (locale): ExcelColumn[] => [
    { key: "nameAr", headerAr: "الاسم بالعربية", headerEn: "Arabic Name", width: 24 },
    { key: "nameEn", headerAr: "الاسم بالإنجليزية", headerEn: "English Name", width: 24 },
    { key: "code", headerAr: "الرمز", headerEn: "Code", width: 14 },
    {
      key: "isActive",
      headerAr: "الحالة",
      headerEn: "Status",
      width: 14,
      value: (r) =>
        r.isActive ? (locale === "ar" ? "نشطة" : "Active") : locale === "ar" ? "معطّلة" : "Inactive",
    },
  ],
});
