import { guard, ok, readBody } from "@/lib/api";
import { Order } from "@/models/Order";
import { OrderStatusSchema } from "@/lib/validators";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * Advances an order's status and appends to its timeline. Delivering stamps
 * deliveredAt and flags an SLA breach if it lands after slaDueAt.
 */
export const POST = guard({ permission: "ops.orders:update" }, async ({ request, params, user }) => {
  const body = await readBody(request, OrderStatusSchema);
  const order = await Order.findById(params.id);
  if (!order) return ok({ error: "NOT_FOUND" }, 404);

  const now = new Date();
  order.status = body.status;
  order.timeline.push({ status: body.status, at: now, by: user.id as never, note: body.note });

  if (body.status === "delivered") {
    order.deliveredAt = now;
    if (order.slaDueAt && now > new Date(order.slaDueAt)) order.slaBreached = true;
  }
  await order.save();

  await writeAudit({
    actor: user,
    action: "update",
    resource: "ops.orders",
    resourceId: String(order._id),
    resourceLabel: order.orderNumber,
    meta: { status: body.status },
  });

  return ok(order.toObject());
});
