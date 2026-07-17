import { exportRoute } from "@/lib/exportFactory";
import { Employee } from "@/models/Employee";
import { employeeListSpec } from "../shared";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: Employee,
  resource: "hr.employees",
  listSpec: employeeListSpec,
  sheetName: "Employees",
  titleAr: "الموظفون",
  titleEn: "Employees",
  filenameAr: "الموظفون",
  filenameEn: "employees",
  columns: (): ExcelColumn[] => [
    { key: "employeeNumber", headerAr: "الرقم الوظيفي", headerEn: "Emp #", width: 14 },
    { key: "nameAr", headerAr: "الاسم", headerEn: "Name", width: 30 },
    { key: "jobTitle", headerAr: "المسمى الوظيفي", headerEn: "Job Title", width: 18 },
    { key: "idNumber", headerAr: "رقم الهوية / الإقامة", headerEn: "Iqama / ID", width: 18 },
    { key: "nationality", headerAr: "الجنسية", headerEn: "Nationality", width: 16 },
    {
      key: "status",
      headerAr: "الحالة",
      headerEn: "Status",
      width: 14,
      value: (r) => String(r.status ?? ""),
    },
    { key: "email", headerAr: "البريد الإلكتروني", headerEn: "Email", width: 28 },
    { key: "phone", headerAr: "الهاتف", headerEn: "Phone", width: 16 },
    { key: "workLocation", headerAr: "موقع العمل", headerEn: "Work Location", width: 16 },
    { key: "hireDate", headerAr: "تاريخ التعيين", headerEn: "Hire Date", width: 16, format: "date" },
    { key: "iban", headerAr: "الآيبان", headerEn: "IBAN", width: 26 },
    { key: "bank", headerAr: "البنك", headerEn: "Bank", width: 14 },
  ],
});
