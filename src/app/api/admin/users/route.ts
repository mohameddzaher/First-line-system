import { guard, ok, readBody } from "@/lib/api";
import { User } from "@/models/User";
import { Employee } from "@/models/Employee";
import { hashPassword } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { runListQuery } from "@/lib/listQuery";
import { parseListQuery } from "@/lib/query";
import { CreateUserSchema } from "@/lib/validators";
import { checkPrivilegeChange } from "@/lib/privilegeGuard";

export const runtime = "nodejs";

export const GET = guard({ permission: "admin.users:read" }, async ({ request }) => {
  const query = parseListQuery(new URL(request.url).searchParams);
  const result = await runListQuery(User, query, {
    searchFields: ["firstName", "lastName", "email"],
    filterMap: {
      role: (v) => ({ role: v }),
      status: (v) => ({ isActive: v === "active" }),
    },
    sortable: ["firstName", "email", "role", "createdAt", "lastLoginAt"],
    defaultSort: "createdAt",
    populate: [
      { path: "employee", select: "nameAr nameEn employeeNumber idNumber" },
      { path: "directManager", select: "firstName lastName email" },
    ] as unknown as string,
  });
  return ok(result);
});

export const POST = guard({ permission: "admin.users:create" }, async ({ request, user }) => {
  const body = await readBody(request, CreateUserSchema);

  // Creating a user must not be a route to minting a super admin.
  const privilegeError = checkPrivilegeChange(user, body, null);
  if (privilegeError) return ok({ error: privilegeError }, 403);

  // One login per employee — enforce before the write so the error is clean.
  if (body.employee) {
    const linked = await User.findOne({ employee: body.employee }).lean();
    if (linked) {
      return ok({ error: "EMPLOYEE_ALREADY_LINKED" }, 409);
    }
  }

  const passwordHash = await hashPassword(body.password);
  const created = await User.create({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    passwordHash,
    role: body.role as never,
    employee: body.employee ?? null,
    directManager: body.directManager ?? null,
    assignedCustomers: body.assignedCustomers as never,
    extraPermissions: body.extraPermissions,
    deniedPermissions: body.deniedPermissions,
    isActive: body.isActive,
    createdBy: user.id as never,
  });

  // Keep the employee's email in step with their login for consistency.
  if (body.employee) {
    await Employee.findByIdAndUpdate(body.employee, { $set: { email: body.email } });
  }

  await writeAudit({
    actor: user,
    action: "create",
    resource: "admin.users",
    resourceId: String(created._id),
    resourceLabel: `${created.firstName} ${created.lastName} (${created.email})`,
    changes: [
      { field: "email", from: null, to: created.email },
      { field: "role", from: null, to: created.role },
    ],
  });

  const json = created.toObject();
  delete (json as { passwordHash?: string }).passwordHash;
  return ok(json, 201);
});
