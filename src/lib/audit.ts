import "server-only";
import { connectDB } from "@/lib/db";
import { AuditLog, type AuditAction, type IAuditChange } from "@/models/AuditLog";
import { requestContext, type CurrentUser } from "@/lib/auth";

/** Fields that must never be written to the audit trail. */
const REDACTED = new Set(["passwordHash", "password", "__v", "updatedAt", "createdAt"]);

/**
 * Field-level diff between two records. Only changed fields are stored, so an
 * update to one column doesn't dump the whole document into the log.
 */
export function diff(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): IAuditChange[] {
  const changes: IAuditChange[] = [];
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);

  for (const key of keys) {
    if (REDACTED.has(key)) continue;
    const from = before?.[key];
    const to = after?.[key];
    if (!isEqual(from, to)) {
      changes.push({ field: key, from: normalize(from), to: normalize(to) });
    }
  }
  return changes;
}

function normalize(value: unknown): unknown {
  if (value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object" && "toString" in value && !Array.isArray(value)) {
    // ObjectId and friends — store the string form, not the BSON wrapper.
    const proto = Object.getPrototypeOf(value)?.constructor?.name;
    if (proto === "ObjectId") return String(value);
  }
  return value;
}

function isEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

export interface AuditInput {
  actor: CurrentUser | null;
  action: AuditAction;
  resource: string;
  resourceId?: string | null;
  resourceLabel?: string;
  changes?: IAuditChange[];
  meta?: Record<string, unknown>;
}

/**
 * Writes an audit entry. Never throws — a failed audit write must not roll back
 * or block the user's action, but it is surfaced in the server log.
 */
export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    await connectDB();
    const { ip, userAgent } = await requestContext();
    await AuditLog.create({
      actor: input.actor?.id ?? null,
      actorName: input.actor?.fullName ?? "System",
      actorEmail: input.actor?.email ?? "",
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      resourceLabel: input.resourceLabel ?? "",
      changes: input.changes ?? [],
      ip,
      userAgent,
      meta: input.meta ?? {},
    });
  } catch (err) {
    console.error("[audit] failed to write entry", { resource: input.resource, err });
  }
}
