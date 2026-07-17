import { exportRoute } from "@/lib/exportFactory";
import { SalesTarget } from "@/models/SalesTarget";
import { targetSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: SalesTarget,
  resource: "sales.targets",
  listSpec: targetSpec,
  sheetName: "Targets",
  titleAr: "المستهدفات",
  titleEn: "Targets",
  filenameAr: "المستهدفات",
  filenameEn: "targets",
  columns: (): ExcelColumn[] => [
    { key: "owner", headerAr: "المسؤول", headerEn: "Owner", width: 24, value: (r) => { const o = r.owner as { firstName?: string; lastName?: string } | null; return o ? `${o.firstName} ${o.lastName}` : ""; } },
    { key: "period", headerAr: "الفترة", headerEn: "Period", width: 16 },
    { key: "targetAmount", headerAr: "المستهدف", headerEn: "Target", width: 18, format: "currency" },
  ],
});
