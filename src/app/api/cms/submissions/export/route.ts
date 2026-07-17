import { exportRoute } from "@/lib/exportFactory";
import { Submission } from "@/models/Submission";
import { submissionSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: Submission,
  resource: "cms.submissions",
  listSpec: submissionSpec,
  sheetName: "Submissions",
  titleAr: "الرسائل الواردة",
  titleEn: "Submissions",
  filenameAr: "الرسائل",
  filenameEn: "submissions",
  columns: (): ExcelColumn[] => [
    { key: "createdAt", headerAr: "التاريخ", headerEn: "Date", width: 20, format: "datetime" },
    { key: "type", headerAr: "النوع", headerEn: "Type", width: 14 },
    { key: "name", headerAr: "الاسم", headerEn: "Name", width: 22 },
    { key: "email", headerAr: "البريد", headerEn: "Email", width: 26 },
    { key: "phone", headerAr: "الهاتف", headerEn: "Phone", width: 16 },
    { key: "subject", headerAr: "الموضوع", headerEn: "Subject", width: 24 },
    { key: "message", headerAr: "الرسالة", headerEn: "Message", width: 40 },
    { key: "status", headerAr: "الحالة", headerEn: "Status", width: 12 },
  ],
});
