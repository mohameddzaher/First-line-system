import { exportRoute } from "@/lib/exportFactory";
import { Task } from "@/models/Task";
import { taskSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: Task,
  resource: "hr.tasks",
  listSpec: taskSpec,
  sheetName: "Tasks",
  titleAr: "المهام",
  titleEn: "Tasks",
  filenameAr: "المهام",
  filenameEn: "tasks",
  columns: (): ExcelColumn[] => [
    { key: "title", headerAr: "العنوان", headerEn: "Title", width: 34 },
    { key: "kind", headerAr: "النوع", headerEn: "Kind", width: 14 },
    { key: "status", headerAr: "الحالة", headerEn: "Status", width: 14 },
    { key: "priority", headerAr: "الأولوية", headerEn: "Priority", width: 12 },
    { key: "dueDate", headerAr: "تاريخ الاستحقاق", headerEn: "Due Date", width: 16, format: "date" },
  ],
});
