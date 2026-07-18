import { exportRoute } from "@/lib/exportFactory";
import { Attendance } from "@/models/Attendance";
import { attendanceSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: Attendance,
  resource: "hr.attendance",
  listSpec: attendanceSpec,
  sheetName: "Attendance",
  titleAr: "الحضور والانصراف",
  titleEn: "Attendance",
  filenameAr: "الحضور",
  filenameEn: "attendance",
  columns: (): ExcelColumn[] => [
    { key: "date", headerAr: "التاريخ", headerEn: "Date", width: 16, format: "date" },
    { key: "employee", headerAr: "الموظف", headerEn: "Employee", width: 26, value: (r) => (r.employee as { nameAr?: string } | null)?.nameAr ?? "" },
    { key: "status", headerAr: "الحالة", headerEn: "Status", width: 14 },
    { key: "checkIn", headerAr: "الحضور", headerEn: "Check In", width: 12 },
    { key: "checkOut", headerAr: "الانصراف", headerEn: "Check Out", width: 12 },
    { key: "hours", headerAr: "الساعات", headerEn: "Hours", width: 10, format: "number" },
  ],
});
