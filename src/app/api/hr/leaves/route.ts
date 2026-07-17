import { guard, ok, readBody } from "@/lib/api";
import { Leave } from "@/models/Leave";
import { Employee } from "@/models/Employee";
import { CreateLeaveSchema } from "@/lib/validators";
import { writeAudit } from "@/lib/audit";
import { runListQuery, type ListSpec } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import { computeLeaveBalance } from "@/lib/leaveBalance";
import { daysBetween } from "@/lib/utils";
import type { ILeave } from "@/models/Leave";

export const runtime = "nodejs";

export const leaveSpec: ListSpec<ILeave> = {
  searchFields: ["reason"],
  refSearch: [
    { localField: "employee", model: () => Employee, fields: ["nameAr", "nameEn", "idNumber", "employeeNumber"] },
  ],
  filterMap: {
    status: (v) => ({ status: v }),
    employee: (v) => ({ employee: v }),
    leaveType: (v) => ({ leaveType: v }),
  },
  sortable: ["startDate", "endDate", "status", "days", "createdAt"],
  defaultSort: "createdAt",
  populate: [
    { path: "employee", select: "nameAr employeeNumber idNumber" },
    { path: "leaveType", select: "nameAr nameEn code affectsBalance" },
  ],
};

export const GET = guard({ permission: "hr.leaves:read" }, async ({ request }) => {
  const query = parseListQuery(new URL(request.url).searchParams);
  const result = await runListQuery(Leave, query, leaveSpec);
  return ok(result);
});

export const POST = guard({ permission: "hr.leaves:create" }, async ({ request, user }) => {
  const body = await readBody(request, CreateLeaveSchema);

  if (body.endDate < body.startDate) {
    return ok({ error: "INVALID_RANGE" }, 422);
  }

  // Days is derived, never trusted from the client. Snapshot the balance so the
  // request records what the employee had available when they asked.
  const days = daysBetween(body.startDate, body.endDate);
  const balance = await computeLeaveBalance(body.employee);

  const created = await Leave.create({
    employee: body.employee,
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
    resourceLabel: `${days} ${"days"}`,
    meta: { days, balanceAtRequest: balance.available },
  });

  return ok(created.toObject(), 201);
});
