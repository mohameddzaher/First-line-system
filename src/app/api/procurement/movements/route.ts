import { guard, ok, readBody } from "@/lib/api";
import { StockMovement } from "@/models/StockMovement";
import { InventoryItem } from "@/models/InventoryItem";
import { CreateMovementSchema } from "@/lib/validators";
import { writeAudit } from "@/lib/audit";
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

  const item = await InventoryItem.findById(body.item);
  if (!item) return ok({ error: "ITEM_NOT_FOUND" }, 404);

  let delta = 0;
  if (body.type === "in") delta = body.quantity;
  else if (body.type === "out" || body.type === "transfer") delta = -body.quantity;
  else if (body.type === "adjustment") delta = body.quantity - item.quantity; // set to target

  if (item.quantity + delta < 0) return ok({ error: "INSUFFICIENT_STOCK", available: item.quantity }, 400);

  item.quantity += delta;
  await item.save();

  const movement = await StockMovement.create({
    item: body.item,
    type: body.type,
    quantity: body.quantity,
    delta,
    balanceAfter: item.quantity,
    reason: body.reason,
    reference: body.reference,
    employee: body.employee || null,
    createdBy: user.id,
  });

  await writeAudit({
    actor: user,
    action: body.type === "in" ? "assign" : "update",
    resource: "procurement.movements",
    resourceId: String(movement._id),
    resourceLabel: `${item.name}: ${delta > 0 ? "+" : ""}${delta}`,
    meta: { balanceAfter: item.quantity },
  });

  return ok(movement.toObject(), 201);
});
