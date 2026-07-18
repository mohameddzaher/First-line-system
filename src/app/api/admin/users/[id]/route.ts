import { guard, ok, readBody } from "@/lib/api";
import { User } from "@/models/User";
import { Employee } from "@/models/Employee";
import { hashPassword } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { diff } from "@/lib/audit";
import { UpdateUserSchema } from "@/lib/validators";
import { checkPrivilegeChange } from "@/lib/privilegeGuard";
import { CLEARED_LOCK } from "@/lib/loginGuard";

export const runtime = "nodejs";

export const GET = guard({ permission: "admin.users:read" }, async ({ params }) => {
  const doc = await User.findById(params.id)
    .populate("employee", "nameAr nameEn employeeNumber idNumber")
    .populate("directManager", "firstName lastName email")
    .lean();
  if (!doc) return ok({ error: "NOT_FOUND" }, 404);
  return ok(doc);
});

export const PATCH = guard({ permission: "admin.users:update" }, async ({ request, params, user }) => {
  const body = await readBody(request, UpdateUserSchema);
  const existing = await User.findById(params.id);
  if (!existing) return ok({ error: "NOT_FOUND" }, 404);

  const before = existing.toObject() as unknown as Record<string, unknown>;

  // Holding admin.users:update must not be a route to super admin.
  const privilegeError = checkPrivilegeChange(user, body, {
    _id: existing._id,
    role: existing.role,
  });
  if (privilegeError) return ok({ error: privilegeError }, 403);

  if (body.employee && String(body.employee) !== String(existing.employee ?? "")) {
    const linked = await User.findOne({ employee: body.employee, _id: { $ne: existing._id } }).lean();
    if (linked) return ok({ error: "EMPLOYEE_ALREADY_LINKED" }, 409);
  }

  const fields: (keyof typeof body)[] = [
    "firstName",
    "lastName",
    "email",
    "role",
    "employee",
    "directManager",
    "assignedCustomers",
    "extraPermissions",
    "deniedPermissions",
    "isActive",
  ];
  for (const field of fields) {
    if (body[field] !== undefined) {
      (existing as unknown as Record<string, unknown>)[field] = body[field];
    }
  }

  // A new password (non-empty) rehashes and invalidates every live session for
  // this user by bumping the version the token is checked against.
  if (body.password) {
    existing.passwordHash = await hashPassword(body.password);
    existing.sessionVersion = (existing.sessionVersion ?? 1) + 1;
    // An admin-issued password is how a brute-force lockout gets lifted.
    Object.assign(existing, CLEARED_LOCK);
  }
  // Re-enabling an account also clears any lockout left over from the attack
  // that got it disabled.
  if (body.isActive === true && !before.isActive) {
    Object.assign(existing, CLEARED_LOCK);
  }
  // Deactivating a user should also kill their current session.
  if (body.isActive === false && before.isActive) {
    existing.sessionVersion = (existing.sessionVersion ?? 1) + 1;
  }

  await existing.save();

  if (body.employee) {
    await Employee.findByIdAndUpdate(body.employee, { $set: { email: existing.email } });
  }

  const after = existing.toObject() as unknown as Record<string, unknown>;
  await writeAudit({
    actor: user,
    action: "update",
    resource: "admin.users",
    resourceId: String(existing._id),
    resourceLabel: `${existing.firstName} ${existing.lastName} (${existing.email})`,
    changes: diff(before, after),
  });

  delete (after as { passwordHash?: string }).passwordHash;
  return ok(after);
});

export const DELETE = guard({ permission: "admin.users:delete" }, async ({ params, user }) => {
  const existing = await User.findById(params.id);
  if (!existing) return ok({ error: "NOT_FOUND" }, 404);

  // Never let an admin delete their own account out from under themselves.
  if (String(existing._id) === user.id) {
    return ok({ error: "CANNOT_DELETE_SELF" }, 400);
  }

  await existing.deleteOne();

  await writeAudit({
    actor: user,
    action: "delete",
    resource: "admin.users",
    resourceId: String(existing._id),
    resourceLabel: `${existing.firstName} ${existing.lastName} (${existing.email})`,
  });

  return ok({ ok: true });
});
