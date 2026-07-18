import { z } from "zod";
import { guard, ok, readBody } from "@/lib/api";
import { User } from "@/models/User";
import { createSessionCookie, hashPassword, verifyPassword } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, "At least 8 characters").max(128),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] })
  .refine((d) => d.newPassword !== d.currentPassword, { message: "New password must differ", path: ["newPassword"] });

/**
 * Lets the signed-in user rotate their own password. Bumping sessionVersion
 * invalidates every other session; this device is re-issued a fresh cookie so
 * the user isn't kicked out of the tab they're working in.
 */
export const POST = guard({ authOnly: true }, async ({ request, user }) => {
  const body = await readBody(request, ChangePasswordSchema);

  const account = await User.findById(user.id).select("+passwordHash");
  if (!account) return ok({ error: "NOT_FOUND" }, 404);

  const valid = await verifyPassword(body.currentPassword, account.passwordHash);
  if (!valid) {
    await writeAudit({
      actor: user,
      action: "login_failed",
      resource: "admin.users",
      resourceId: user.id,
      resourceLabel: user.email,
      meta: { reason: "change_password_wrong_current" },
    });
    return ok({ error: "WRONG_CURRENT_PASSWORD" }, 400);
  }

  account.passwordHash = await hashPassword(body.newPassword);
  account.sessionVersion = (account.sessionVersion ?? 1) + 1;
  await account.save();

  // Keep this device signed in with the new session version.
  await createSessionCookie({
    sub: String(account._id),
    email: account.email,
    name: `${account.firstName} ${account.lastName}`.trim(),
    role: account.role,
    employeeId: account.employee ? String(account.employee) : null,
    v: account.sessionVersion,
  });

  await writeAudit({
    actor: user,
    action: "update",
    resource: "admin.users",
    resourceId: user.id,
    resourceLabel: user.email,
    meta: { passwordChanged: true },
  });

  return ok({ ok: true });
});
