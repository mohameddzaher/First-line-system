import { exportRoute } from "@/lib/exportFactory";
import { PurchaseOrder } from "@/models/PurchaseOrder";
import { poSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: PurchaseOrder,
  resource: "procurement.orders",
  listSpec: poSpec,
  sheetName: "Purchase Orders",
  titleAr: "أوامر الشراء",
  titleEn: "Purchase Orders",
  filenameAr: "أوامر-الشراء",
  filenameEn: "purchase-orders",
  columns: (): ExcelColumn[] => [
    { key: "orderNumber", headerAr: "رقم الأمر", headerEn: "PO Number", width: 18 },
    { key: "supplier", headerAr: "المورّد", headerEn: "Supplier", width: 26, value: (r) => (r.supplier as { name?: string } | null)?.name ?? "" },
    { key: "status", headerAr: "الحالة", headerEn: "Status", width: 14 },
    { key: "orderDate", headerAr: "تاريخ الأمر", headerEn: "Order Date", width: 16, format: "date" },
    { key: "subtotal", headerAr: "الإجمالي الفرعي", headerEn: "Subtotal", width: 16, format: "currency" },
    { key: "vat", headerAr: "الضريبة", headerEn: "VAT", width: 14, format: "currency" },
    { key: "total", headerAr: "الإجمالي", headerEn: "Total", width: 16, format: "currency" },
  ],
});
