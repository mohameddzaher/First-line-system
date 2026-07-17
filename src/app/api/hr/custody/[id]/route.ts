import { guard, ok, readBody } from "@/lib/api";
import { Custody } from "@/models/Custody";
import { UpdateCustodySchema } from "@/lib/validators";
import { writeAudit, diff } from "@/lib/audit";
import { custodySpec } from "../route";

export const runtime = "nodejs";

export const GET = guard({ permission: "hr.custody:read" }, async ({ params }) => {
  const doc = await Custody.findById(params.id)
    .populate(custodySpec.populate as string)
    .lean();
  if (!doc) return ok({ error: "NOT_FOUND" }, 404);
  return ok(doc);
});

export const PATCH = guard({ permission: "hr.custody:update" }, async ({ request, params, user }) => {
  const existing = await Custody.findById(params.id);
  if (!existing) return ok({ error: "NOT_FOUND" }, 404);

  const before = existing.toObject() as unknown as Record<string, unknown>;
  const data = (await readBody(request, UpdateCustodySchema)) as Record<string, unknown>;

  if (data.employee === "") data.employee = null;
  if (data.warehouse === "") data.warehouse = null;

  const prevEmployee = existing.employee ? String(existing.employee) : null;
  const nextEmployee =
    data.employee !== undefined ? (data.employee ? String(data.employee) : null) : prevEmployee;

  // Assign / transfer / return transitions append to the history trail.
  if (nextEmployee && nextEmployee !== prevEmployee) {
    existing.history.push({
      action: prevEmployee ? "transferred" : "assigned",
      employee: data.employee as never,
      date: new Date(),
      by: user.id as never,
    });
    data.status = "assigned";
    data.assignedDate = new Date();
  } else if (!nextEmployee && prevEmployee) {
    existing.history.push({
      action: "returned",
      employee: null,
      date: new Date(),
      by: user.id as never,
    });
    if (!data.status || data.status === "assigned") data.status = "in_stock";
    data.returnedDate = new Date();
  }

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) (existing as unknown as Record<string, unknown>)[key] = value;
  }
  await existing.save();

  const after = existing.toObject() as unknown as Record<string, unknown>;
  await writeAudit({
    actor: user,
    action: "update",
    resource: "hr.custody",
    resourceId: String(after._id),
    resourceLabel: `${after.name ?? ""}`,
    changes: diff(before, after),
  });

  return ok(after);
});

export const DELETE = guard({ permission: "hr.custody:delete" }, async ({ params, user }) => {
  const existing = await Custody.findById(params.id);
  if (!existing) return ok({ error: "NOT_FOUND" }, 404);
  const json = existing.toObject() as unknown as Record<string, unknown>;
  await existing.deleteOne();
  await writeAudit({
    actor: user,
    action: "delete",
    resource: "hr.custody",
    resourceId: String(json._id),
    resourceLabel: `${json.name ?? ""}`,
  });
  return ok({ ok: true });
});
