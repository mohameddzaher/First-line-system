import { collectionRoute } from "@/lib/crudFactory";
import { PurchaseOrder } from "@/models/PurchaseOrder";
import { Company } from "@/models/Company";
import { CreatePOSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { IPurchaseOrder } from "@/models/PurchaseOrder";

export const runtime = "nodejs";

export const poSpec: ListSpec<IPurchaseOrder> = {
  searchFields: ["orderNumber"],
  refSearch: [{ localField: "supplier", model: () => Company, fields: ["name", "nameAr"] }],
  filterMap: {
    status: (v) => ({ status: v }),
    supplier: (v) => ({ supplier: v }),
  },
  sortable: ["orderNumber", "status", "orderDate", "total", "createdAt"],
  defaultSort: "createdAt",
  populate: [
    { path: "supplier", select: "name nameAr" },
    { path: "warehouse", select: "name" },
  ],
};

/** Recomputes subtotal/vat/total from the line items — never trust client totals. */
export function computeTotals(data: Record<string, unknown>): Record<string, unknown> {
  const lines = (data.lines as { quantity: number; unitPrice: number }[] | undefined) ?? [];
  const subtotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
  const vatRate = Number(data.vatRate ?? 15);
  const vat = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  data.subtotal = Math.round(subtotal * 100) / 100;
  data.vat = vat;
  data.total = Math.round((subtotal + vat) * 100) / 100;
  for (const k of Object.keys(data)) if (data[k] === "") data[k] = null;
  return data;
}

export const { GET, POST } = collectionRoute({
  model: PurchaseOrder,
  resource: "procurement.orders",
  listSpec: poSpec,
  createSchema: CreatePOSchema,
  updateSchema: CreatePOSchema,
  label: (d) => String(d.orderNumber ?? ""),
  beforeWrite: (data) => computeTotals(data),
});
