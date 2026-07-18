import { guard, ok, readBody } from "@/lib/api";
import { Order } from "@/models/Order";
import { Employee } from "@/models/Employee";
import { AssignOrderSchema } from "@/lib/validators";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

/** Assigns/reassigns a driver to an order and moves a "new" order to "assigned". */
export const POST = guard({ permission: "ops.orders:update" }, async ({ request, params, user }) => {
  const body = await readBody(request, AssignOrderSchema);
  const order = await Order.findById(params.id);
  if (!order) return ok({ error: "NOT_FOUND" }, 404);

  const driver = await Employee.findById(body.driver).select("nameAr");
  if (!driver) return ok({ error: "DRIVER_NOT_FOUND" }, 404);

  order.driver = body.driver as never;
  if (order.status === "new") {
    order.status = "assigned";
    order.timeline.push({ status: "assigned", at: new Date(), by: user.id as never });
  }
  await order.save();

  await writeAudit({
    actor: user,
    action: "assign",
    resource: "ops.orders",
    resourceId: String(order._id),
    resourceLabel: `${order.orderNumber} → ${driver.nameAr}`,
  });

  return ok(order.toObject());
});
