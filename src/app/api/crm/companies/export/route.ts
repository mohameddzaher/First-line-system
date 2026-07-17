import { exportRoute } from "@/lib/exportFactory";
import { Company } from "@/models/Company";
import { companySpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: Company,
  resource: "crm.companies",
  listSpec: companySpec,
  sheetName: "Companies",
  titleAr: "الشركات",
  titleEn: "Companies",
  filenameAr: "الشركات",
  filenameEn: "companies",
  columns: (): ExcelColumn[] => [
    { key: "name", headerAr: "الاسم", headerEn: "Name", width: 30 },
    { key: "kind", headerAr: "النوع", headerEn: "Kind", width: 14 },
    { key: "status", headerAr: "الحالة", headerEn: "Status", width: 14 },
    { key: "city", headerAr: "المدينة", headerEn: "City", width: 16 },
    { key: "phone", headerAr: "الهاتف", headerEn: "Phone", width: 16 },
    { key: "email", headerAr: "البريد", headerEn: "Email", width: 26 },
    { key: "crNumber", headerAr: "السجل التجاري", headerEn: "CR Number", width: 18 },
  ],
});
