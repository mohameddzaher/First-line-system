import { guard, ok, readBody } from "@/lib/api";
import { Leave } from "@/models/Leave";
import { Employee } from "@/models/Employee";
import { UpdateLeaveSchema } from "@/lib/validators";
import { writeAudit, diff } from "@/lib/audit";
import { leaveSpec } from "../route";

export const runtime = "nodejs";

export const GET = guard({ permission: "hr.leaves:read" }, async ({ params }) => {
  const doc = await Leave.findById(params.id).populate(leaveSpec.populate as string).lean();
  if (!doc) return ok({ error: "NOT_FOUND" }, 404);
  return ok(doc);
});

export const PATCH = guard({ permission: "hr.leaves:update" }, async ({ request, params, user }) => {
  const existing = await Leave.findById(params.id);
  if (!existing) return ok({ error: "NOT_FOUND" }, 404);

  const before = existing.toObject() as unknown as Record<string, unknown>;
  const data = await readBody(request, UpdateLeaveSchema);

  const statusChanged = data.status && data.status !== existing.status;
  const wasApproved = existing.status === "approved";

  if (data.reason !== undefined) existing.reason = data.reason;
  if (data.status) {
    existing.status = data.status;
    existing.reviewedBy = user.id as never;
    existing.reviewedAt = new Date();
    if (data.reviewNote) existing.reviewNote = data.reviewNote;
  }
  await existing.save();

  // Approving/rejecting a leave shifts the employee's working status so the HR
  // dashboard "On Leave" count and the employee row stay truthful.
  if (statusChanged && data.status === "approved") {
    await Employee.findByIdAndUpdate(existing.employee, { $set: { status: "on_leave" } });
  } else if (statusChanged && wasApproved && data.status !== "approved") {
    await Employee.findByIdAndUpdate(existing.employee, { $set: { status: "active" } });
  }

  const after = existing.toObject() as unknown as Record<string, unknown>;
  await writeAudit({
    actor: user,
    action: data.status === "approved" ? "approve" : data.status === "rejected" ? "reject" : "update",
    resource: "hr.leaves",
    resourceId: String(after._id),
    resourceLabel: `${after.days ?? ""} days`,
    changes: diff(before, after),
  });

  return ok(after);
});

export const DELETE = guard({ permission: "hr.leaves:delete" }, async ({ params, user }) => {
  const existing = await Leave.findById(params.id);
  if (!existing) return ok({ error: "NOT_FOUND" }, 404);
  const json = existing.toObject() as unknown as Record<string, unknown>;
  await existing.deleteOne();
  await writeAudit({
    actor: user,
    action: "delete",
    resource: "hr.leaves",
    resourceId: String(json._id),
    resourceLabel: `${json.days ?? ""} days`,
  });
  return ok({ ok: true });
});
