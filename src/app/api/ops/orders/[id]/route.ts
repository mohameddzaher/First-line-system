import { guard, ok, readBody } from "@/lib/api";
import { Order } from "@/models/Order";
import { UpdateOrderSchema } from "@/lib/validators";
import { writeAudit, diff } from "@/lib/audit";
import { orderSpec } from "../route";

export const runtime = "nodejs";

export const GET = guard({ permission: "ops.orders:read" }, async ({ params }) => {
  const doc = await Order.findById(params.id)
    .populate(orderSpec.populate as string)
    .populate("timeline.by", "firstName lastName")
    .lean();
  if (!doc) return ok({ error: "NOT_FOUND" }, 404);
  return ok(doc);
});

export const PATCH = guard({ permission: "ops.orders:update" }, async ({ request, params, user }) => {
  const existing = await Order.findById(params.id);
  if (!existing) return ok({ error: "NOT_FOUND" }, 404);
  const before = existing.toObject() as unknown as Record<string, unknown>;
  const data = (await readBody(request, UpdateOrderSchema)) as Record<string, unknown>;
  if (data.driver === "") data.driver = null;
  if (data.project === "") data.project = null;

  for (const [k, v] of Object.entries(data)) if (v !== undefined) (existing as unknown as Record<string, unknown>)[k] = v;
  await existing.save();

  const after = existing.toObject() as unknown as Record<string, unknown>;
  await writeAudit({ actor: user, action: "update", resource: "ops.orders", resourceId: String(after._id), resourceLabel: String(after.orderNumber ?? ""), changes: diff(before, after) });
  return ok(after);
});

export const DELETE = guard({ permission: "ops.orders:delete" }, async ({ params, user }) => {
  const existing = await Order.findById(params.id);
  if (!existing) return ok({ error: "NOT_FOUND" }, 404);
  const json = existing.toObject() as unknown as Record<string, unknown>;
  await existing.deleteOne();
  await writeAudit({ actor: user, action: "delete", resource: "ops.orders", resourceId: String(json._id), resourceLabel: String(json.orderNumber ?? "") });
  return ok({ ok: true });
});
