import { exportRoute } from "@/lib/exportFactory";
import { Contact } from "@/models/Contact";
import { contactSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: Contact,
  resource: "crm.contacts",
  listSpec: contactSpec,
  sheetName: "Contacts",
  titleAr: "جهات الاتصال",
  titleEn: "Contacts",
  filenameAr: "جهات-الاتصال",
  filenameEn: "contacts",
  columns: (): ExcelColumn[] => [
    { key: "name", headerAr: "الاسم", headerEn: "Name", width: 26 },
    { key: "company", headerAr: "الشركة", headerEn: "Company", width: 26, value: (r) => (r.company as { name?: string } | null)?.name ?? "" },
    { key: "title", headerAr: "المسمى", headerEn: "Title", width: 20 },
    { key: "email", headerAr: "البريد", headerEn: "Email", width: 26 },
    { key: "phone", headerAr: "الهاتف", headerEn: "Phone", width: 16 },
  ],
});
