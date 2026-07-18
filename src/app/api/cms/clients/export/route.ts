import { exportRoute } from "@/lib/exportFactory";
import { ClientLogo } from "@/models/ClientLogo";
import { clientSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: ClientLogo,
  resource: "cms.clients",
  listSpec: clientSpec,
  sheetName: "Clients",
  titleAr: "شعارات العملاء",
  titleEn: "Client Logos",
  filenameAr: "شعارات-العملاء",
  filenameEn: "client-logos",
  columns: (locale): ExcelColumn[] => [
    { key: "name", headerAr: "الاسم", headerEn: "Name", width: 28 },
    { key: "website", headerAr: "الموقع", headerEn: "Website", width: 32 },
    { key: "order", headerAr: "الترتيب", headerEn: "Order", width: 12 },
    {
      key: "active",
      headerAr: "الحالة",
      headerEn: "Status",
      width: 14,
      value: (r) =>
        r.active ? (locale === "ar" ? "ظاهر" : "Visible") : locale === "ar" ? "مخفي" : "Hidden",
    },
  ],
});
