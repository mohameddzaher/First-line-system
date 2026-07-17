import { guard, ok, readBody } from "@/lib/api";
import { Leave } from "@/models/Leave";
import { writeAudit } from "@/lib/audit";
import { computeLeaveBalance } from "@/lib/leaveBalance";
import { daysBetween } from "@/lib/utils";
import { z } from "zod";

export const runtime = "nodejs";

const SelfLeaveSchema = z.object({
  leaveType: z.string().regex(/^[0-9a-fA-F]{24}$/),
  startDate: z.string().min(1).transform((v) => new Date(v)),
  endDate: z.string().min(1).transform((v) => new Date(v)),
  reason: z.string().trim().optional(),
});

/** Lists the signed-in employee's own leaves. */
export const GET = guard({ authOnly: true }, async ({ user }) => {
  if (!user.employeeId) return ok({ rows: [], total: 0 });
  const rows = await Leave.find({ employee: user.employeeId })
    .populate("leaveType", "nameAr nameEn")
    .sort({ createdAt: -1 })
    .lean();
  return ok({ rows, total: rows.length });
});

/** Employee self-submits a leave request; always lands as pending. */
export const POST = guard({ authOnly: true }, async ({ request, user }) => {
  if (!user.employeeId) return ok({ error: "NO_EMPLOYEE" }, 400);
  const body = await readBody(request, SelfLeaveSchema);
  if (body.endDate < body.startDate) return ok({ error: "INVALID_RANGE" }, 422);

  const days = daysBetween(body.startDate, body.endDate);
  const balance = await computeLeaveBalance(user.employeeId);

  const created = await Leave.create({
    employee: user.employeeId,
    leaveType: body.leaveType,
    startDate: body.startDate,
    endDate: body.endDate,
    days,
    reason: body.reason,
    status: "pending",
    balanceAtRequest: balance.available,
    createdBy: user.id,
  });

  await writeAudit({
    actor: user,
    action: "create",
    resource: "hr.leaves",
    resourceId: String(created._id),
    resourceLabel: `${days} days (self)`,
    meta: { self: true },
  });

  return ok(created.toObject(), 201);
});
