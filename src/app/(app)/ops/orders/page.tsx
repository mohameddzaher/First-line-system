import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale, getT } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Project } from "@/models/Project";
import { runListQuery } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import { serialize } from "@/lib/serialize";
import { orderSpec } from "@/app/api/ops/orders/route";
import { employeeOptions } from "@/lib/pickerOptions";
import { OrdersClient, type OrderRow } from "./OrdersClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requirePermission("ops.orders:read");
  await connectDB();
  const [locale, t, sp] = await Promise.all([getLocale(), getT(), searchParams]);
  const query = parseListQuery(new URLSearchParams(sp));

  const [result, projects, employees, cities] = await Promise.all([
    runListQuery(Order, query, orderSpec),
    Project.find({ isActive: true }).select("nameAr nameEn").lean(),
    employeeOptions(),
    Order.distinct("city"),
  ]);

  return (
    <OrdersClient
      initial={serialize(result) as unknown as ListResult<OrderRow>}
      locale={locale}
      title={t("ops.orders")}
      projects={projects.map((p) => ({ value: String(p._id), label: locale === "ar" ? p.nameAr : p.nameEn ?? p.nameAr }))}
      employees={employees}
      cities={(cities as string[]).filter(Boolean).sort().map((c) => ({ value: c, label: c }))}
    />
  );
}
