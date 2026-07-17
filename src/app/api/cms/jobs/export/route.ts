import { exportRoute } from "@/lib/exportFactory";
import { Job } from "@/models/Job";
import { jobSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: Job,
  resource: "cms.jobs",
  listSpec: jobSpec,
  sheetName: "Jobs",
  titleAr: "الوظائف",
  titleEn: "Jobs",
  filenameAr: "الوظائف",
  filenameEn: "jobs",
  columns: (): ExcelColumn[] => [
    { key: "title_ar", headerAr: "المسمى", headerEn: "Title (AR)", width: 28 },
    { key: "title_en", headerAr: "المسمى (EN)", headerEn: "Title (EN)", width: 28 },
    { key: "department", headerAr: "القسم", headerEn: "Department", width: 18 },
    { key: "type", headerAr: "النوع", headerEn: "Type", width: 14 },
    { key: "published", headerAr: "منشور", headerEn: "Published", width: 12, value: (r) => (r.published ? "Yes" : "No") },
  ],
});
