import { exportRoute } from "@/lib/exportFactory";
import { Employee } from "@/models/Employee";
import type { ListSpec } from "@/lib/listQuery";
import type { IEmployee } from "@/models/Employee";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

/** Payroll view is the employee roster with salary components; scoped to non-terminated staff. */
export const payrollSpec: ListSpec<IEmployee> = {
  searchFields: ["nameAr", "nameEn", "idNumber", "employeeNumber", "iban"],
  filterMap: {
    department: (v) => ({ department: v }),
    status: (v) => ({ status: v }),
  },
  sortable: ["nameAr", "basicSalary", "employeeNumber", "createdAt"],
  defaultSort: "nameAr",
  baseFilter: { status: { $ne: "terminated" } },
  populate: [{ path: "department", select: "nameAr nameEn" }],
};

const total = (r: Record<string, unknown>) =>
  (Number(r.basicSalary) || 0) + (Number(r.housingAllowance) || 0) + (Number(r.transportAllowance) || 0) + (Number(r.otherAllowance) || 0);

export const GET = exportRoute({
  model: Employee,
  resource: "hr.payroll",
  listSpec: payrollSpec,
  sheetName: "Payroll",
  titleAr: "كشف الرواتب",
  titleEn: "Payroll",
  filenameAr: "كشف-الرواتب",
  filenameEn: "payroll",
  columns: (): ExcelColumn[] => [
    { key: "employeeNumber", headerAr: "الرقم الوظيفي", headerEn: "Emp #", width: 14 },
    { key: "nameAr", headerAr: "الاسم", headerEn: "Name", width: 28 },
    { key: "department", headerAr: "الإدارة", headerEn: "Department", width: 18, value: (r) => (r.department as { nameAr?: string } | null)?.nameAr ?? "" },
    { key: "basicSalary", headerAr: "الأساسي", headerEn: "Basic", width: 14, format: "currency" },
    { key: "housingAllowance", headerAr: "بدل السكن", headerEn: "Housing", width: 14, format: "currency" },
    { key: "transportAllowance", headerAr: "بدل النقل", headerEn: "Transport", width: 14, format: "currency" },
    { key: "otherAllowance", headerAr: "بدلات أخرى", headerEn: "Other", width: 14, format: "currency" },
    { key: "total", headerAr: "الإجمالي", headerEn: "Total", width: 16, format: "currency", value: (r) => total(r) },
    { key: "iban", headerAr: "الآيبان", headerEn: "IBAN", width: 26 },
    { key: "bank", headerAr: "البنك", headerEn: "Bank", width: 14 },
  ],
});
