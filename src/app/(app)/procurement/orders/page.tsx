import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { PurchaseOrder } from "@/models/PurchaseOrder";
import { runListQuery } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import { serialize } from "@/lib/serialize";
import { poSpec } from "@/app/api/procurement/orders/route";
import { companyOptions, warehouseOptions } from "@/lib/pickerOptions";
import { OrdersClient, type OrderRow } from "./OrdersClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Purchase Orders" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requirePermission("procurement.orders:read");
  await connectDB();
  const [locale, sp] = await Promise.all([getLocale(), searchParams]);
  const query = parseListQuery(new URLSearchParams(sp));

  const [result, suppliers, warehouses] = await Promise.all([
    runListQuery(PurchaseOrder, query, poSpec),
    companyOptions("vendor"),
    warehouseOptions(),
  ]);

  return (
    <OrdersClient
      initial={serialize(result) as unknown as ListResult<OrderRow>}
      locale={locale}
      title={locale === "ar" ? "أوامر الشراء" : "Purchase Orders"}
      suppliers={suppliers}
      warehouses={warehouses}
    />
  );
}
