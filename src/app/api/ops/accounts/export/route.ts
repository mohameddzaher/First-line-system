import { exportRoute } from "@/lib/exportFactory";
import { ThirdPartyAccount } from "@/models/ThirdPartyAccount";
import { accountSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: ThirdPartyAccount,
  resource: "ops.accounts",
  listSpec: accountSpec,
  sheetName: "Accounts",
  titleAr: "حسابات المشاريع",
  titleEn: "Project Accounts",
  filenameAr: "الحسابات",
  filenameEn: "accounts",
  columns: (): ExcelColumn[] => [
    {
      key: "project",
      headerAr: "المشروع",
      headerEn: "Project",
      width: 20,
      value: (r) => (r.project as { nameAr?: string } | null)?.nameAr ?? "",
    },
    { key: "username", headerAr: "اسم المستخدم", headerEn: "Username", width: 22 },
    { key: "externalId", headerAr: "المعرّف الخارجي", headerEn: "External ID", width: 18 },
    {
      key: "riders",
      headerAr: "المناديب النشطون",
      headerEn: "Active Riders",
      width: 34,
      value: (r) =>
        (r.assignments as { employee?: { nameAr?: string }; active?: boolean; shift?: string }[] | undefined)
          ?.filter((a) => a.active)
          .map((a) => `${a.employee?.nameAr ?? ""} (${a.shift})`)
          .join("; ") ?? "",
    },
    { key: "status", headerAr: "الحالة", headerEn: "Status", width: 14 },
  ],
});
