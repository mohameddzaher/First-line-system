import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { createSessionCookie, verifyPassword } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { permissionsForRole } from "@/lib/rbac";
import { resolveLandingPage } from "@/lib/landing";

export const runtime = "nodejs";

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

/** Naive per-IP throttle. Survives hot reload; resets on deploy. */
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (rateLimited(ip)) {
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

  const passwordOk = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!passwordOk) {
    await writeAudit({
      actor: null,
      action: "login_failed",
      resource: "admin.users",
      resourceId: String(user._id),
      resourceLabel: user.email,
      meta: { reason: "bad_password", ip },
    });
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

  attempts.delete(ip);
  user.lastLoginAt = new Date();
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
