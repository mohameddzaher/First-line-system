import { exportRoute } from "@/lib/exportFactory";
import { Article } from "@/models/Article";
import { articleSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: Article,
  resource: "cms.articles",
  listSpec: articleSpec,
  sheetName: "Articles",
  titleAr: "المقالات",
  titleEn: "Articles",
  filenameAr: "المقالات",
  filenameEn: "articles",
  columns: (): ExcelColumn[] => [
    { key: "title_ar", headerAr: "العنوان", headerEn: "Title (AR)", width: 30 },
    { key: "title_en", headerAr: "العنوان (EN)", headerEn: "Title (EN)", width: 30 },
    { key: "slug", headerAr: "المعرّف", headerEn: "Slug", width: 20 },
    { key: "published", headerAr: "منشور", headerEn: "Published", width: 12, value: (r) => (r.published ? "Yes" : "No") },
    { key: "views", headerAr: "المشاهدات", headerEn: "Views", width: 12, format: "number" },
  ],
});
