import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { connectDB } from "@/lib/db";
import { AuthError, getCurrentUser, requirePermission, type CurrentUser } from "@/lib/auth";

export type RouteHandler = (ctx: {
  request: NextRequest;
  user: CurrentUser;
  params: Record<string, string>;
}) => Promise<NextResponse> | NextResponse;

interface GuardOptions {
  permission?: string;
  /** Any signed-in user may call (self-service). */
  authOnly?: boolean;
}

/**
 * Wraps a route handler with: DB connection, auth/permission enforcement, and
 * uniform error shapes. Every mutation route in the app goes through this, so
 * a missing permission is always 403 JSON and never a stack trace.
 */
export function guard(options: GuardOptions, handler: RouteHandler) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    try {
      await connectDB();

      let user: CurrentUser;
      if (options.permission) {
        user = await requirePermission(options.permission);
      } else {
        const current = await getCurrentUser();
        if (!current) throw new AuthError("UNAUTHENTICATED");
        user = current;
      }

      const params = await context.params;
      return await handler({ request, user, params });
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json(
      { error: err.code, permission: err.permission },
      { status: err.code === "UNAUTHENTICATED" ? 401 : 403 },
    );
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "VALIDATION", issues: err.flatten() },
      { status: 422 },
    );
  }
  // Duplicate key (unique index) — surface the offending field.
  if (isMongoDuplicate(err)) {
    return NextResponse.json(
      { error: "DUPLICATE", field: duplicateField(err) },
      { status: 409 },
    );
  }
  console.error("[api] unhandled error", err);
  return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
}

/** Parses and validates a JSON body, throwing ZodError on mismatch. */
export async function readBody<T>(request: NextRequest, schema: ZodType<T>): Promise<T> {
  const json = await request.json().catch(() => {
    throw new ZodError([]);
  });
  return schema.parse(json);
}

function isMongoDuplicate(err: unknown): err is { code: number; keyValue?: Record<string, unknown> } {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

function duplicateField(err: { keyValue?: Record<string, unknown> }): string {
  return err.keyValue ? Object.keys(err.keyValue)[0] ?? "" : "";
}

export function ok(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}
