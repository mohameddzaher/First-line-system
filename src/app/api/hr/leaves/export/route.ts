import { exportRoute } from "@/lib/exportFactory";
import { Leave } from "@/models/Leave";
import { leaveSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: Leave,
  resource: "hr.leaves",
  listSpec: leaveSpec,
  sheetName: "Leaves",
  titleAr: "طلبات الإجازة",
  titleEn: "Leave Requests",
  filenameAr: "طلبات-الإجازة",
  filenameEn: "leaves",
  columns: (): ExcelColumn[] => [
    {
      key: "employee",
      headerAr: "الموظف",
      headerEn: "Employee",
      width: 28,
      value: (r) => (r.employee as { nameAr?: string } | null)?.nameAr ?? "",
    },
    {
      key: "leaveType",
      headerAr: "نوع الإجازة",
      headerEn: "Leave Type",
      width: 20,
      value: (r) => (r.leaveType as { nameAr?: string } | null)?.nameAr ?? "",
    },
    { key: "startDate", headerAr: "من", headerEn: "From", width: 16, format: "date" },
    { key: "endDate", headerAr: "إلى", headerEn: "To", width: 16, format: "date" },
    { key: "days", headerAr: "الأيام", headerEn: "Days", width: 10, format: "number" },
    { key: "status", headerAr: "الحالة", headerEn: "Status", width: 14 },
  ],
});
