import { exportRoute } from "@/lib/exportFactory";
import { EmployeeRequest } from "@/models/EmployeeRequest";
import { requestSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: EmployeeRequest,
  resource: "hr.requests",
  listSpec: requestSpec,
  sheetName: "Requests",
  titleAr: "طلبات الموظفين",
  titleEn: "Employee Requests",
  filenameAr: "طلبات-الموظفين",
  filenameEn: "requests",
  columns: (): ExcelColumn[] => [
    {
      key: "employee",
      headerAr: "الموظف",
      headerEn: "Employee",
      width: 26,
      value: (r) => (r.employee as { nameAr?: string } | null)?.nameAr ?? "",
    },
    { key: "category", headerAr: "الفئة", headerEn: "Category", width: 20 },
    { key: "subject", headerAr: "الموضوع", headerEn: "Subject", width: 34 },
    { key: "status", headerAr: "الحالة", headerEn: "Status", width: 14 },
    { key: "updatedAt", headerAr: "آخر تحديث", headerEn: "Updated", width: 18, format: "datetime" },
  ],
});
