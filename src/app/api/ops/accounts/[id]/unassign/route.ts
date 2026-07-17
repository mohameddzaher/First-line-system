import { guard, ok, readBody } from "@/lib/api";
import { ThirdPartyAccount } from "@/models/ThirdPartyAccount";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

export const runtime = "nodejs";

const UnassignSchema = z.object({ assignmentId: z.string().regex(/^[0-9a-fA-F]{24}$/) });

/** Ends one active assignment on the account (rider stops working it). */
export const POST = guard({ permission: "ops.assignments:update" }, async ({ request, params, user }) => {
  const body = await readBody(request, UnassignSchema);
  const account = await ThirdPartyAccount.findById(params.id);
  if (!account) return ok({ error: "NOT_FOUND" }, 404);

  // assignments is a Mongoose DocumentArray at runtime, so .id() is available.
  const assignment = (account.assignments as unknown as {
    id: (id: string) => { active: boolean; endDate: Date | null; employee: unknown; shift: string } | null;
  }).id(body.assignmentId);
  if (!assignment) return ok({ error: "ASSIGNMENT_NOT_FOUND" }, 404);

  const now = new Date();
  assignment.active = false;
  assignment.endDate = now;
  account.history.push({ action: "removed", employee: assignment.employee as never, shift: assignment.shift as never, date: now, by: user.id as never });
  if (!account.assignments.some((a) => a.active)) account.status = "idle";
  await account.save();

  await writeAudit({
    actor: user,
    action: "revoke",
    resource: "ops.assignments",
    resourceId: String(account._id),
    resourceLabel: account.username,
  });

  return ok(account.toObject());
});
