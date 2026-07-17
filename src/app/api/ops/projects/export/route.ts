import { exportRoute } from "@/lib/exportFactory";
import { Project } from "@/models/Project";
import { projectSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: Project,
  resource: "ops.projects",
  listSpec: projectSpec,
  sheetName: "Projects",
  titleAr: "المشاريع",
  titleEn: "Projects",
  filenameAr: "المشاريع",
  filenameEn: "projects",
  columns: (): ExcelColumn[] => [
    { key: "nameAr", headerAr: "الاسم بالعربية", headerEn: "Arabic Name", width: 24 },
    { key: "nameEn", headerAr: "الاسم بالإنجليزية", headerEn: "English Name", width: 24 },
    { key: "code", headerAr: "الرمز", headerEn: "Code", width: 14 },
  ],
});
