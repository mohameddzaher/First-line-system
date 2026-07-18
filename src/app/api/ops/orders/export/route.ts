import { exportRoute } from "@/lib/exportFactory";
import { Order } from "@/models/Order";
import { orderSpec } from "../route";
import type { ExcelColumn } from "@/lib/excel";

export const runtime = "nodejs";

export const GET = exportRoute({
  model: Order,
  resource: "ops.orders",
  listSpec: orderSpec,
  sheetName: "Orders",
  titleAr: "الطلبات",
  titleEn: "Orders",
  filenameAr: "الطلبات",
  filenameEn: "orders",
  columns: (): ExcelColumn[] => [
    { key: "orderNumber", headerAr: "رقم الطلب", headerEn: "Order #", width: 16 },
    { key: "project", headerAr: "المنصة", headerEn: "Platform", width: 16, value: (r) => (r.project as { nameAr?: string } | null)?.nameAr ?? "" },
    { key: "driver", headerAr: "المندوب", headerEn: "Driver", width: 24, value: (r) => (r.driver as { nameAr?: string } | null)?.nameAr ?? "" },
    { key: "city", headerAr: "المدينة", headerEn: "City", width: 14 },
    { key: "customerName", headerAr: "العميل", headerEn: "Customer", width: 20 },
    { key: "status", headerAr: "الحالة", headerEn: "Status", width: 14 },
    { key: "amount", headerAr: "المبلغ", headerEn: "Amount", width: 14, format: "currency" },
    { key: "placedAt", headerAr: "تاريخ الطلب", headerEn: "Placed", width: 18, format: "datetime" },
    { key: "slaBreached", headerAr: "تجاوز SLA", headerEn: "SLA Breach", width: 12, value: (r) => (r.slaBreached ? "Yes" : "No") },
  ],
});
