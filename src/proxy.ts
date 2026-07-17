import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "fl_session";
const key = new TextEncoder().encode(process.env.AUTH_SECRET);

/**
 * Edge gate. Only checks that a *signed* session exists — it can't hit Mongo, so
 * the authoritative check (user still active, role still valid, sessionVersion
 * still current) happens in requireUser() on every protected page and route.
 * This exists to keep unauthenticated traffic from ever reaching a server render.
 */
const PROTECTED_PREFIXES = ["/dashboard", "/hr", "/fleet", "/admin", "/me", "/ops", "/procurement", "/crm", "/sales"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const valid = token ? await isValid(token) : false;

  if (isProtected && !valid) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Bounce back to the intended page after signing in.
    url.searchParams.set("next", `${pathname}${search}`);
    const response = NextResponse.redirect(url);
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  // A signed-in user has no reason to see the login form.
  if (pathname === "/login" && valid) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

async function isValid(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, key, { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
