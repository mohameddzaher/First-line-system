import { exportRoute } from "@/lib/exportFactory";
import { FinanceTransaction } from "@/models/FinanceTransaction";
import { txnSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: FinanceTransaction,
  resource: "finance.transactions",
  listSpec: txnSpec,
  sheetName: "Finance",
  titleAr: "الحركات المالية",
  titleEn: "Finance Transactions",
  filenameAr: "الحركات-المالية",
  filenameEn: "transactions",
  columns: (): ExcelColumn[] => [
    { key: "reference", headerAr: "المرجع", headerEn: "Reference", width: 18 },
    { key: "kind", headerAr: "النوع", headerEn: "Kind", width: 12 },
    { key: "category", headerAr: "الفئة", headerEn: "Category", width: 20 },
    { key: "amount", headerAr: "المبلغ", headerEn: "Amount", width: 16, format: "currency" },
    { key: "date", headerAr: "التاريخ", headerEn: "Date", width: 16, format: "date" },
    { key: "status", headerAr: "الحالة", headerEn: "Status", width: 14 },
    { key: "method", headerAr: "طريقة الدفع", headerEn: "Method", width: 16 },
  ],
});
