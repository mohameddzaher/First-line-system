import type { Metadata } from "next";
import { Warehouse } from "@/models/Warehouse";
import { loadList } from "@/lib/loadList";
import { warehouseSpec } from "@/app/api/procurement/warehouses/route";
import { getT } from "@/i18n/server";

import { WarehousesClient, type WarehouseRow } from "./WarehousesClient";
import type { ListResult } from "@/lib/query";

export const metadata: Metadata = { title: "Warehouses" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { result, locale } = await loadList(Warehouse, "procurement.warehouses:read", warehouseSpec, sp);
  const t = await getT();

  return (
    <WarehousesClient
      initial={result as unknown as ListResult<WarehouseRow>}
      locale={locale}
      title={locale === "ar" ? "المستودعات" : "Warehouses"}
      
    />
  );
}
