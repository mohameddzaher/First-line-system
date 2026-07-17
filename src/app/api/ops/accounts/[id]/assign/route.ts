import { guard, ok, readBody } from "@/lib/api";
import { ThirdPartyAccount } from "@/models/ThirdPartyAccount";
import { Employee } from "@/models/Employee";
import { AssignAccountSchema } from "@/lib/validators";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * Assigns a rider to this account on a given shift. An account can hold multiple
 * riders across different shifts, so an existing active assignment on the SAME
 * shift is closed first; other shifts are left untouched. If the rider is active
 * on another account's same shift, that is closed too (a rider works one account
 * per shift), which is how "transfer a rider between accounts" happens.
 */
export const POST = guard({ permission: "ops.assignments:create" }, async ({ request, params, user }) => {
  const body = await readBody(request, AssignAccountSchema);

  const account = await ThirdPartyAccount.findById(params.id);
  if (!account) return ok({ error: "NOT_FOUND" }, 404);

  const employee = await Employee.findById(body.employee).select("nameAr");
  if (!employee) return ok({ error: "EMPLOYEE_NOT_FOUND" }, 404);

  const now = body.startDate ?? new Date();

  // Close any active assignment on the same shift on THIS account.
  for (const a of account.assignments) {
    if (a.active && a.shift === body.shift) {
      a.active = false;
      a.endDate = now;
      account.history.push({ action: "transferred_out", employee: a.employee, shift: a.shift, date: now, by: user.id as never });
    }
  }

  // Free the rider from any other account on the same shift (rider works one
  // account per shift — this is the transfer mechanism).
  await ThirdPartyAccount.updateMany(
    { _id: { $ne: account._id }, assignments: { $elemMatch: { employee: body.employee, shift: body.shift, active: true } } },
    {
      $set: { "assignments.$[a].active": false, "assignments.$[a].endDate": now },
      $push: { history: { action: "transferred_out", employee: body.employee, shift: body.shift, date: now, by: user.id } },
    },
    { arrayFilters: [{ "a.employee": body.employee, "a.shift": body.shift, "a.active": true }] },
  );

  account.assignments.push({
    employee: body.employee as never,
    shift: body.shift,
    startDate: now,
    endDate: null,
    active: true,
  });
  account.history.push({ action: "assigned", employee: body.employee as never, shift: body.shift, date: now, by: user.id as never, note: body.note });
  if (account.status === "idle") account.status = "active";
  await account.save();

  await writeAudit({
    actor: user,
    action: "assign",
    resource: "ops.assignments",
    resourceId: String(account._id),
    resourceLabel: `${account.username} → ${employee.nameAr} (${body.shift})`,
  });

  return ok(account.toObject());
});
