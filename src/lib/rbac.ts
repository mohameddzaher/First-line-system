/**
 * Central permission registry.
 *
 * A permission is "<resource>:<action>". Resources are dotted paths that mirror
 * the sidebar tree (hr.employees, fleet.vehicles, ...). Actions are read/create/
 * update/delete/export plus a few resource-specific ones (e.g. leaves:approve).
 *
 * Roles are collections of permissions. A role may hold the wildcard "*", which
 * satisfies every check — reserved for super_admin.
 */

export const ACTIONS = ["read", "create", "update", "delete", "export"] as const;
export type Action = (typeof ACTIONS)[number];

export const RESOURCES = [
  // Administration
  "admin.users",
  "admin.roles",
  "admin.audit",
  "admin.settings",
  // Website CMS
  "cms.pages",
  "cms.articles",
  "cms.clients",
  "cms.jobs",
  "cms.submissions",
  "cms.seo",
  // Human Resources
  "hr.dashboard",
  "hr.employees",
  "hr.contracts",
  "hr.leaves",
  "hr.requests",
  "hr.custody",
  "hr.licenses",
  "hr.leaveTypes",
  "hr.tasks",
  "hr.complaints",
  "hr.payroll",
  "hr.attendance",
  // Fleet
  "fleet.dashboard",
  "fleet.vehicles",
  "fleet.authorizations",
  "fleet.accidents",
  "fleet.maintenance",
  // Operations
  "ops.dashboard",
  "ops.projects",
  "ops.accounts",
  "ops.assignments",
  "ops.orders",
  // Finance
  "finance.dashboard",
  "finance.transactions",
  // Reports
  "reports.view",
  // Procurement & warehouse
  "procurement.dashboard",
  "procurement.requests",
  "procurement.orders",
  "procurement.inventory",
  "procurement.warehouses",
  "procurement.movements",
  // CRM
  "crm.dashboard",
  "crm.companies",
  "crm.contacts",
  "crm.deals",
  // Sales
  "sales.dashboard",
  "sales.targets",
  // Executive
  "exec.overview",
] as const;
export type Resource = (typeof RESOURCES)[number];

/** `approve` is a workflow action that only some resources (leaves, requests, POs) use. */
export type Permission = `${Resource}:${Action}` | `${Resource}:approve` | "*";

const all = (r: Resource): Permission[] => ACTIONS.map((a) => `${r}:${a}` as Permission);
const readOnly = (r: Resource): Permission[] => [`${r}:read`, `${r}:export`] as Permission[];

export const ROLES = {
  super_admin: {
    labelEn: "Super Admin",
    labelAr: "مدير النظام",
    permissions: ["*"] as Permission[],
  },
  admin: {
    labelEn: "Administrator",
    labelAr: "مسؤول",
    permissions: [
      ...all("admin.users"),
      ...readOnly("admin.audit"),
      ...all("cms.pages"),
      ...all("cms.articles"),
      ...all("cms.clients"),
      ...all("cms.jobs"),
      ...all("cms.submissions"),
      ...all("cms.seo"),
      ...readOnly("exec.overview"),
    ],
  },
  hr_manager: {
    labelEn: "HR Manager",
    labelAr: "مدير الموارد البشرية",
    permissions: [
      ...readOnly("hr.dashboard"),
      ...all("hr.employees"),
      ...all("hr.contracts"),
      ...all("hr.leaves"),
      "hr.leaves:approve" as Permission,
      ...all("hr.requests"),
      "hr.requests:approve" as Permission,
      ...all("hr.custody"),
      ...all("hr.licenses"),
      ...all("hr.leaveTypes"),
      ...all("hr.tasks"),
      ...all("hr.complaints"),
      ...readOnly("hr.payroll"),
      ...all("hr.attendance"),
      ...readOnly("reports.view"),
      ...readOnly("fleet.vehicles"),
      ...readOnly("admin.audit"),
    ],
  },
  hr_officer: {
    labelEn: "HR Officer",
    labelAr: "أخصائي موارد بشرية",
    permissions: [
      ...readOnly("hr.dashboard"),
      ...all("hr.employees").filter((p) => !p.endsWith(":delete")),
      ...readOnly("hr.contracts"),
      ...all("hr.leaves").filter((p) => !p.endsWith(":delete")),
      ...all("hr.requests").filter((p) => !p.endsWith(":delete")),
      ...all("hr.custody").filter((p) => !p.endsWith(":delete")),
      ...readOnly("hr.licenses"),
      ...readOnly("hr.leaveTypes"),
      ...all("hr.tasks"),
      ...all("hr.complaints"),
    ],
  },
  fleet_manager: {
    labelEn: "Fleet Manager",
    labelAr: "مدير الأسطول",
    permissions: [
      ...readOnly("fleet.dashboard"),
      ...all("fleet.vehicles"),
      ...all("fleet.authorizations"),
      ...all("fleet.accidents"),
      ...all("fleet.maintenance"),
      ...readOnly("hr.employees"),
      ...readOnly("hr.custody"),
    ],
  },
  ops_manager: {
    labelEn: "Operations Manager",
    labelAr: "مدير العمليات",
    permissions: [
      ...readOnly("ops.dashboard"),
      ...all("ops.projects"),
      ...all("ops.accounts"),
      ...all("ops.assignments"),
      ...all("ops.orders"),
      ...readOnly("reports.view"),
      ...readOnly("hr.employees"),
      ...readOnly("fleet.vehicles"),
    ],
  },
  finance_manager: {
    labelEn: "Finance Manager",
    labelAr: "مدير المالية",
    permissions: [
      ...readOnly("finance.dashboard"),
      ...all("finance.transactions"),
      ...readOnly("procurement.orders"),
      ...readOnly("hr.payroll"),
      ...readOnly("reports.view"),
    ],
  },
  procurement_manager: {
    labelEn: "Procurement Manager",
    labelAr: "مدير المشتريات",
    permissions: [
      ...readOnly("procurement.dashboard"),
      ...all("procurement.requests"),
      ...all("procurement.orders"),
      ...all("procurement.inventory"),
      ...all("procurement.warehouses"),
      ...all("procurement.movements"),
      ...readOnly("crm.companies"),
      ...readOnly("hr.custody"),
    ],
  },
  crm_manager: {
    labelEn: "CRM Manager",
    labelAr: "مدير علاقات العملاء",
    permissions: [
      ...readOnly("crm.dashboard"),
      ...all("crm.companies"),
      ...all("crm.contacts"),
      ...all("crm.deals"),
    ],
  },
  sales_manager: {
    labelEn: "Sales Manager",
    labelAr: "مدير المبيعات",
    permissions: [
      ...readOnly("sales.dashboard"),
      ...all("sales.targets"),
      ...all("crm.deals"),
      ...readOnly("crm.companies"),
      ...readOnly("crm.contacts"),
    ],
  },
  employee: {
    labelEn: "Employee",
    labelAr: "موظف",
    // Self-service only. Scoped at the query level to the linked employee.
    permissions: [] as Permission[],
  },
} as const;

export type RoleKey = keyof typeof ROLES;
export const ROLE_KEYS = Object.keys(ROLES) as RoleKey[];

export function permissionsForRole(role: RoleKey): Permission[] {
  return [...(ROLES[role]?.permissions ?? [])];
}

/** Does this permission set satisfy the required permission? */
export function can(granted: readonly string[], required: string): boolean {
  if (granted.includes("*")) return true;
  if (granted.includes(required)) return true;
  // "hr.employees:*" style grants
  const [resource] = required.split(":");
  return granted.includes(`${resource}:*`);
}

export function isValidRole(role: string): role is RoleKey {
  return ROLE_KEYS.includes(role as RoleKey);
}
