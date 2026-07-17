import { exportRoute } from "@/lib/exportFactory";
import { Contract } from "@/models/Contract";
import { contractSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: Contract,
  resource: "hr.contracts",
  listSpec: contractSpec,
  sheetName: "Contracts",
  titleAr: "العقود",
  titleEn: "Contracts",
  filenameAr: "العقود",
  filenameEn: "contracts",
  columns: (): ExcelColumn[] => [
    {
      key: "employee",
      headerAr: "الموظف",
      headerEn: "Employee",
      width: 28,
      value: (r) => (r.employee as { nameAr?: string } | null)?.nameAr ?? "",
    },
    { key: "type", headerAr: "النوع", headerEn: "Type", width: 14 },
    { key: "startDate", headerAr: "البداية", headerEn: "Start", width: 16, format: "date" },
    { key: "endDate", headerAr: "النهاية", headerEn: "End", width: 16, format: "date" },
    { key: "annualLeaveDays", headerAr: "أيام الإجازة السنوية", headerEn: "Annual Leave", width: 16, format: "number" },
    { key: "status", headerAr: "الحالة", headerEn: "Status", width: 14 },
  ],
});
