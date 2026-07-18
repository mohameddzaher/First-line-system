import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { createSessionCookie, verifyPassword } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { permissionsForRole } from "@/lib/rbac";
import { resolveLandingPage } from "@/lib/landing";
import {
  CLEARED_LOCK,
  clearIpAttempts,
  clientIp,
  ipThrottled,
  lockSecondsRemaining,
  registerFailure,
} from "@/lib/loginGuard";

export const runtime = "nodejs";

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const ip = clientIp(request);

  if (ipThrottled(ip)) {
    return NextResponse.json(
      { error: "TOO_MANY_ATTEMPTS" },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findOne({ email: parsed.data.email }).select("+passwordHash");

  // Same response for unknown email and wrong password — don't leak which
  // addresses have accounts.
  if (!user) {
    await writeAudit({
      actor: null,
      action: "login_failed",
      resource: "admin.users",
      resourceLabel: parsed.data.email,
      meta: { reason: "unknown_email", ip },
    });
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  // Checked before the password so a locked account can't be probed further.
  const lockedFor = lockSecondsRemaining(user);
  if (lockedFor > 0) {
    await writeAudit({
      actor: null,
      action: "login_failed",
      resource: "admin.users",
      resourceId: String(user._id),
      resourceLabel: user.email,
      meta: { reason: "account_locked", ip },
    });
    return NextResponse.json(
      { error: "ACCOUNT_LOCKED", retryAfter: lockedFor },
      { status: 423, headers: { "Retry-After": String(lockedFor) } },
    );
  }

  const passwordOk = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!passwordOk) {
    const next = registerFailure(user);
    await User.updateOne({ _id: user._id }, { $set: next });
    await writeAudit({
      actor: null,
      action: "login_failed",
      resource: "admin.users",
      resourceId: String(user._id),
      resourceLabel: user.email,
      meta: {
        reason: "bad_password",
        ip,
        attempt: next.failedLoginAttempts,
        lockedOut: Boolean(next.lockedUntil),
      },
    });
    // Report the lockout that this attempt just triggered, so the user isn't
    // left retrying a password that can no longer succeed.
    if (next.lockedUntil) {
      const seconds = lockSecondsRemaining({ lockedUntil: next.lockedUntil });
      return NextResponse.json(
        { error: "ACCOUNT_LOCKED", retryAfter: seconds },
        { status: 423, headers: { "Retry-After": String(seconds) } },
      );
    }
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  if (!user.isActive) {
    return NextResponse.json({ error: "ACCOUNT_DISABLED" }, { status: 403 });
  }

  await createSessionCookie({
    sub: String(user._id),
    email: user.email,
    name: `${user.firstName} ${user.lastName}`.trim(),
    role: user.role,
    employeeId: user.employee ? String(user.employee) : null,
    v: user.sessionVersion ?? 1,
  });

  clearIpAttempts(ip);
  user.lastLoginAt = new Date();
  Object.assign(user, CLEARED_LOCK);
  await user.save();

  await writeAudit({
    actor: {
      id: String(user._id),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role,
      permissions: [],
      employeeId: user.employee ? String(user.employee) : null,
      isActive: user.isActive,
    },
    action: "login",
    resource: "admin.users",
    resourceId: String(user._id),
    resourceLabel: user.email,
  });

  // Tell the client where this user can actually land — non-admin roles have no
  // access to the executive dashboard.
  const rolePerms = permissionsForRole(user.role);
  const granted = new Set<string>([...rolePerms, ...(user.extraPermissions ?? [])]);
  for (const denied of user.deniedPermissions ?? []) granted.delete(denied);

  return NextResponse.json({ ok: true, landing: resolveLandingPage([...granted], user.role) });
}
