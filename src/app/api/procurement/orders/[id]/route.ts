import { guard, ok, readBody } from "@/lib/api";
import { PurchaseOrder } from "@/models/PurchaseOrder";
import { InventoryItem } from "@/models/InventoryItem";
import { UpdatePOSchema } from "@/lib/validators";
import { writeAudit, diff } from "@/lib/audit";
import { computeTotals, poSpec } from "../route";

export const runtime = "nodejs";

export const GET = guard({ permission: "procurement.orders:read" }, async ({ params }) => {
  const doc = await PurchaseOrder.findById(params.id).populate(poSpec.populate as string).lean();
  if (!doc) return ok({ error: "NOT_FOUND" }, 404);
  return ok(doc);
});

export const PATCH = guard({ permission: "procurement.orders:update" }, async ({ request, params, user }) => {
  const existing = await PurchaseOrder.findById(params.id);
  if (!existing) return ok({ error: "NOT_FOUND" }, 404);

  const before = existing.toObject() as unknown as Record<string, unknown>;
  const wasReceived = existing.status === "received";
  let data = (await readBody(request, UpdatePOSchema)) as Record<string, unknown>;
  if (data.lines || data.vatRate !== undefined) data = computeTotals({ ...before, ...data });

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) (existing as unknown as Record<string, unknown>)[key] = value;
  }

  // Receiving a PO for the first time increments warehouse stock for each line
  // that maps to an inventory item — this is the procurement -> inventory link.
  if (data.status === "received" && !wasReceived) {
    existing.receivedDate = new Date();
    for (const line of existing.lines) {
      if (line.inventoryItem) {
        await InventoryItem.findByIdAndUpdate(line.inventoryItem, { $inc: { quantity: line.quantity } });
      }
    }
  }
  await existing.save();

  const after = existing.toObject() as unknown as Record<string, unknown>;
  await writeAudit({
    actor: user,
    action: data.status === "approved" ? "approve" : "update",
    resource: "procurement.orders",
    resourceId: String(after._id),
    resourceLabel: String(after.orderNumber ?? ""),
    changes: diff(before, after),
  });

  return ok(after);
});

export const DELETE = guard({ permission: "procurement.orders:delete" }, async ({ params, user }) => {
  const existing = await PurchaseOrder.findById(params.id);
  if (!existing) return ok({ error: "NOT_FOUND" }, 404);
  const json = existing.toObject() as unknown as Record<string, unknown>;
  await existing.deleteOne();
  await writeAudit({
    actor: user,
    action: "delete",
    resource: "procurement.orders",
    resourceId: String(json._id),
    resourceLabel: String(json.orderNumber ?? ""),
  });
  return ok({ ok: true });
});
