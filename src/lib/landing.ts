import { NAVIGATION } from "@/config/navigation";
import { can, type RoleKey } from "@/lib/rbac";

/**
 * Each role's natural home — the dashboard of the module they actually work in.
 * Used only when the user genuinely holds the permission for it.
 */
const ROLE_HOME: Partial<Record<RoleKey, { href: string; permission: string }>> = {
  super_admin: { href: "/dashboard", permission: "exec.overview:read" },
  admin: { href: "/dashboard", permission: "exec.overview:read" },
  hr_manager: { href: "/hr", permission: "hr.dashboard:read" },
  hr_officer: { href: "/hr", permission: "hr.dashboard:read" },
  fleet_manager: { href: "/fleet", permission: "fleet.dashboard:read" },
  ops_manager: { href: "/ops", permission: "ops.dashboard:read" },
  procurement_manager: { href: "/procurement", permission: "procurement.dashboard:read" },
  finance_manager: { href: "/finance", permission: "finance.dashboard:read" },
  crm_manager: { href: "/crm", permission: "crm.dashboard:read" },
  sales_manager: { href: "/sales", permission: "sales.dashboard:read" },
  employee: { href: "/me/profile", permission: "" },
};

/**
 * The first page a user can actually open. Login and every "go home" affordance
 * must use this — sending everyone to /dashboard drops non-admin roles onto a
 * permission error immediately after signing in, because only admins hold
 * `exec.overview:read`.
 */
export function resolveLandingPage(permissions: readonly string[], role?: RoleKey): string {
  // 1. The role's own module dashboard, if they can open it.
  const home = role ? ROLE_HOME[role] : undefined;
  if (home && (home.permission === "" || can(permissions, home.permission))) return home.href;

  // 2. Otherwise the first sidebar item they have access to.
  for (const group of NAVIGATION) {
    for (const item of group.items) {
      if (item.permission && can(permissions, item.permission)) return item.href;
    }
  }

  // 3. Everyone signed in can at least reach their own profile.
  return "/me/profile";
}
