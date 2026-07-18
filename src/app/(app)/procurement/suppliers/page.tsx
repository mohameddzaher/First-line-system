import type { Metadata } from "next";
import { Types } from "mongoose";
import { Company } from "@/models/Company";
import { PurchaseOrder } from "@/models/PurchaseOrder";
import { loadList } from "@/lib/loadList";
import { companySpec } from "@/app/api/crm/companies/route";
import { SuppliersClient } from "./SuppliersClient";
import type { ListResult } from "@/lib/query";
import type { ListSpec } from "@/lib/listQuery";
import type { ICompany } from "@/models/Company";

export const metadata: Metadata = { title: "Suppliers" };
export const dynamic = "force-dynamic";

/**
 * Procurement's view of CRM companies. Same collection, but pinned to vendors so
 * buyers never have to wade through customers — `baseFilter` is applied on the
 * server, so it can't be removed from the query string.
 */
const supplierSpec: ListSpec<ICompany> = {
  ...companySpec,
  baseFilter: { kind: { $in: ["vendor", "both"] } },
};

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const { result, locale } = await loadList(
    Company,
    "procurement.orders:read",
    supplierSpec,
    sp,
  );

  // Spend and open-order counts are what make a supplier list actionable.
  const ids = (result.rows as { _id: string }[]).map((r) => new Types.ObjectId(r._id));
  const agg = await PurchaseOrder.aggregate<{
    _id: unknown;
    orders: number;
    open: number;
    spend: number;
  }>([
    { $match: { supplier: { $in: ids } } },
    {
      $group: {
        _id: "$supplier",
        orders: { $sum: 1 },
        open: { $sum: { $cond: [{ $in: ["$status", ["draft", "pending", "approved"]] }, 1, 0] } },
        // Only received orders are money actually committed.
        spend: { $sum: { $cond: [{ $eq: ["$status", "received"] }, "$total", 0] } },
      },
    },
  ]);

  const stats: Record<string, { orders: number; open: number; spend: number }> = {};
  for (const row of agg) stats[String(row._id)] = { orders: row.orders, open: row.open, spend: row.spend };

  return (
    <SuppliersClient
      initial={result as unknown as ListResult<SupplierRow>}
      locale={locale}
      title={locale === "ar" ? "الموردون" : "Suppliers"}
      stats={stats}
    />
  );
}

export interface SupplierRow {
  _id: string;
  name: string;
  nameAr?: string;
  kind: string;
  status: string;
  phone?: string;
  email?: string;
  city?: string;
}
