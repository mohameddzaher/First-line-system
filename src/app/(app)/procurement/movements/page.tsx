import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getLocale, getT } from "@/i18n/server";
import { connectDB } from "@/lib/db";
import { StockMovement } from "@/models/StockMovement";
import { InventoryItem } from "@/models/InventoryItem";
import { runListQuery } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import { serialize } from "@/lib/serialize";
import { movementSpec } from "@/app/api/procurement/movements/route";
import { MovementsClient, type MovementRow } from "./MovementsClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Stock Movements" };
export const dynamic = "force-dynamic";

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requirePermission("procurement.movements:read");
  await connectDB();
  const [locale, t, sp] = await Promise.all([getLocale(), getT(), searchParams]);
  const query = parseListQuery(new URLSearchParams(sp));

  const [result, items] = await Promise.all([
    runListQuery(StockMovement, query, movementSpec),
    InventoryItem.find({}).select("name sku quantity").sort({ name: 1 }).limit(3000).lean(),
  ]);

  return (
    <MovementsClient
      initial={serialize(result) as unknown as ListResult<MovementRow>}
      locale={locale}
      title={t("procurement.movements")}
      items={items.map((i) => ({ value: String(i._id), label: i.name, hint: `${i.sku ?? ""} · ${i.quantity}` }))}
    />
  );
}
