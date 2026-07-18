import { guard, ok, readBody } from "@/lib/api";
import { StockMovement } from "@/models/StockMovement";
import { InventoryItem } from "@/models/InventoryItem";
import { CreateMovementSchema } from "@/lib/validators";
import { applyStockMovement } from "@/lib/stockLedger";
import { runListQuery, type ListSpec } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import type { IStockMovement } from "@/models/StockMovement";

export const runtime = "nodejs";

export const movementSpec: ListSpec<IStockMovement> = {
  searchFields: ["reason", "reference"],
  refSearch: [{ localField: "item", model: () => InventoryItem, fields: ["name", "sku"] }],
  filterMap: {
    type: (v) => ({ type: v }),
    item: (v) => ({ item: v }),
  },
  sortable: ["createdAt", "type", "quantity"],
  defaultSort: "createdAt",
  populate: [{ path: "item", select: "name sku warehouse" }],
};

export const GET = guard({ permission: "procurement.movements:read" }, async ({ request }) => {
  const query = parseListQuery(new URL(request.url).searchParams);
  const result = await runListQuery(StockMovement, query, movementSpec);
  return ok(result);
});

/**
 * Records a stock movement and applies its signed delta to the item quantity
 * atomically, so the ledger and on-hand stock stay consistent. `out` movements
 * that exceed available stock are rejected.
 */
export const POST = guard({ permission: "procurement.movements:create" }, async ({ request, user }) => {
  const body = await readBody(request, CreateMovementSchema);
  const result = await applyStockMovement(
    {
      item: body.item,
      type: body.type,
      quantity: body.quantity,
      reason: body.reason,
      reference: body.reference,
      employee: body.employee,
    },
    user,
  );

  if (result.error === "ITEM_NOT_FOUND") return ok({ error: result.error }, 404);
  if (result.error === "INSUFFICIENT_STOCK") {
    return ok({ error: result.error, available: result.available }, 400);
  }

  const movement = await StockMovement.findById(result.movementId).lean();
  return ok(movement, 201);
});
