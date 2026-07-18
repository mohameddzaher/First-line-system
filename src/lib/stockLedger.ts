import "server-only";
import { StockMovement } from "@/models/StockMovement";
import { InventoryItem } from "@/models/InventoryItem";
import type { CurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export type LedgerError = "ITEM_NOT_FOUND" | "INSUFFICIENT_STOCK";

export interface LedgerResult {
  error?: LedgerError;
  available?: number;
  movementId?: string;
  balanceAfter?: number;
}

/**
 * The single way stock is allowed to change. Every caller goes through here so
 * the ledger (StockMovement) and on-hand quantity can never diverge — writing
 * `$inc` on the item directly leaves the ledger's balanceAfter lying about the
 * real stock level, which is exactly the bug this replaced.
 */
export async function applyStockMovement(
  input: {
    item: string;
    type: "in" | "out" | "transfer" | "adjustment";
    quantity: number;
    reason?: string;
    reference?: string;
    employee?: string | null;
  },
  actor: CurrentUser,
): Promise<LedgerResult> {
  const item = await InventoryItem.findById(input.item);
  if (!item) return { error: "ITEM_NOT_FOUND" };

  let delta = 0;
  if (input.type === "in") delta = input.quantity;
  else if (input.type === "out" || input.type === "transfer") delta = -input.quantity;
  else if (input.type === "adjustment") delta = input.quantity - item.quantity; // set to target

  if (item.quantity + delta < 0) return { error: "INSUFFICIENT_STOCK", available: item.quantity };

  item.quantity += delta;
  await item.save();

  const movement = await StockMovement.create({
    item: input.item,
    type: input.type,
    quantity: input.quantity,
    delta,
    balanceAfter: item.quantity,
    reason: input.reason,
    reference: input.reference,
    employee: input.employee || null,
    createdBy: actor.id,
  });

  await writeAudit({
    actor,
    action: input.type === "in" ? "assign" : "update",
    resource: "procurement.movements",
    resourceId: String(movement._id),
    resourceLabel: `${item.name}: ${delta > 0 ? "+" : ""}${delta}`,
    meta: { balanceAfter: item.quantity, reference: input.reference },
  });

  return { movementId: String(movement._id), balanceAfter: item.quantity };
}
