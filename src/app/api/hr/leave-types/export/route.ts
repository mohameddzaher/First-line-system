import { exportRoute } from "@/lib/exportFactory";
import { LeaveType } from "@/models/LeaveType";
import { leaveTypeSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: LeaveType,
  resource: "hr.leaveTypes",
  listSpec: leaveTypeSpec,
  sheetName: "Leave Types",
  titleAr: "أنواع الإجازات",
  titleEn: "Leave Types",
  filenameAr: "أنواع-الإجازات",
  filenameEn: "leave-types",
  columns: (locale): ExcelColumn[] => [
    { key: "nameAr", headerAr: "الاسم بالعربية", headerEn: "Arabic Name", width: 22 },
    { key: "nameEn", headerAr: "الاسم بالإنجليزية", headerEn: "English Name", width: 22 },
    { key: "code", headerAr: "الرمز", headerEn: "Code", width: 16 },
    { key: "paid", headerAr: "مدفوعة", headerEn: "Paid", width: 12, value: (r) => (r.paid ? (locale === "ar" ? "نعم" : "Yes") : locale === "ar" ? "لا" : "No") },
    {
      key: "affectsBalance",
      headerAr: "تؤثر على الرصيد",
      headerEn: "Affects Balance",
      width: 16,
      value: (r) => (r.affectsBalance ? (locale === "ar" ? "نعم" : "Yes") : locale === "ar" ? "لا" : "No"),
    },
  ],
});
