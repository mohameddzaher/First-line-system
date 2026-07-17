import type { Metadata } from "next";
import { InventoryItem } from "@/models/InventoryItem";
import { loadList } from "@/lib/loadList";
import { inventoryItemSpec } from "@/app/api/procurement/inventory/route";
import { warehouseOptions } from "@/lib/pickerOptions";
import { InventoryClient, type InventoryRow } from "./InventoryClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Inventory" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { result, locale } = await loadList(InventoryItem, "procurement.inventory:read", inventoryItemSpec, sp);
  const warehouses = await warehouseOptions();
  return (
    <InventoryClient
      initial={result as unknown as ListResult<InventoryRow>}
      locale={locale}
      title={locale === "ar" ? "المخزون" : "Inventory"}
      warehouses={warehouses}
    />
  );
}
