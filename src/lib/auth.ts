import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { can, permissionsForRole, type RoleKey } from "@/lib/rbac";

const SECRET = process.env.AUTH_SECRET;
if (!SECRET) throw new Error("AUTH_SECRET is not defined. Add it to .env.local");

const key = new TextEncoder().encode(SECRET);
export const SESSION_COOKIE = "fl_session";
const SESSION_DAYS = 7;

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  role: RoleKey;
  employeeId: string | null;
  /** Must match the user's current sessionVersion or the session is rejected. */
  v: number;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * The full, DB-backed current user. Re-reads the user on every call so that a
 * revoked role, a deactivated account, or a bumped sessionVersion takes effect
 * immediately rather than at token expiry.
 */
export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: RoleKey;
  permissions: string[];
  employeeId: string | null;
  isActive: boolean;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  await connectDB();
  const user = await User.findById(payload.sub).lean();
  if (!user || !user.isActive) return null;
  if ((user.sessionVersion ?? 1) !== payload.v) return null;

  const rolePerms = permissionsForRole(user.role);
  const granted = new Set<string>([...rolePerms, ...(user.extraPermissions ?? [])]);
  for (const denied of user.deniedPermissions ?? []) granted.delete(denied);

  return {
    id: String(user._id),
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: user.role,
    permissions: [...granted],
    employeeId: user.employee ? String(user.employee) : null,
    isActive: user.isActive,
  };
}

/** Throws if there is no session. Use at the top of every protected route/page. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("UNAUTHENTICATED");
  return user;
}

/** Throws unless the session holds `permission`. */
export async function requirePermission(permission: string): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user.permissions, permission)) {
    throw new AuthError("FORBIDDEN", permission);
  }
  return user;
}

export class AuthError extends Error {
  constructor(
    public code: "UNAUTHENTICATED" | "FORBIDDEN",
    public permission?: string,
  ) {
    super(code === "UNAUTHENTICATED" ? "Not signed in" : `Missing permission: ${permission}`);
    this.name = "AuthError";
  }
}

/** Request metadata for the audit trail. */
export async function requestContext(): Promise<{ ip: string; userAgent: string }> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "";
  return { ip, userAgent: h.get("user-agent") ?? "" };
}
