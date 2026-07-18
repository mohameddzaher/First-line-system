import "server-only";
import type { CurrentUser } from "@/lib/auth";

export type PrivilegeError =
  | "ONLY_SUPER_ADMIN_GRANTS_SUPER_ADMIN"
  | "ONLY_SUPER_ADMIN_EDITS_SUPER_ADMIN"
  | "CANNOT_CHANGE_OWN_ROLE"
  | "CANNOT_CHANGE_OWN_PERMISSIONS"
  | "ONLY_SUPER_ADMIN_GRANTS_WILDCARD";

/**
 * Blocks privilege escalation through the user-management endpoints. Holding
 * `admin.users:update` must not be a path to becoming a super admin:
 *
 *  - only a super admin may grant the super_admin role, or edit a super admin
 *  - nobody may change their own role or their own permission overrides
 *  - only a super admin may hand out the `*` wildcard
 *
 * Returns an error code, or null when the change is allowed.
 */
export function checkPrivilegeChange(
  actor: CurrentUser,
  change: { role?: string; extraPermissions?: string[]; deniedPermissions?: string[] },
  target?: { _id: unknown; role?: string } | null,
): PrivilegeError | null {
  const actorIsSuper = actor.role === "super_admin";
  const isSelf = target ? String(target._id) === actor.id : false;

  if (change.role === "super_admin" && !actorIsSuper) return "ONLY_SUPER_ADMIN_GRANTS_SUPER_ADMIN";
  if (target?.role === "super_admin" && !actorIsSuper) return "ONLY_SUPER_ADMIN_EDITS_SUPER_ADMIN";
  if (isSelf && change.role !== undefined && change.role !== target?.role) return "CANNOT_CHANGE_OWN_ROLE";
  if (isSelf && (change.extraPermissions !== undefined || change.deniedPermissions !== undefined)) {
    return "CANNOT_CHANGE_OWN_PERMISSIONS";
  }
  if (!actorIsSuper && (change.extraPermissions ?? []).includes("*")) {
    return "ONLY_SUPER_ADMIN_GRANTS_WILDCARD";
  }
  return null;
}
