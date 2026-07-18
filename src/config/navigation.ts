import type { TranslationKey } from "@/i18n/dictionaries";

export interface NavItem {
  labelKey: TranslationKey;
  href: string;
  /** Hidden unless the session holds this permission. */
  permission?: string;
  /** Visible to any signed-in user (self-service pages). */
  always?: boolean;
}

export interface NavGroup {
  id: string;
  labelKey: TranslationKey;
  icon: string;
  items: NavItem[];
}

/**
 * The sidebar tree. Groups collapse/expand; a group disappears entirely when the
 * user can't see any of its children, so the nav never shows a dead end.
 * `icon` names map to lucide icons in Sidebar.tsx.
 */
export const NAVIGATION: NavGroup[] = [
  {
    id: "executive",
    labelKey: "nav.executive",
    icon: "LayoutDashboard",
    items: [
      { labelKey: "nav.executive", href: "/dashboard", permission: "exec.overview:read" },
      { labelKey: "reports.view", href: "/reports", permission: "reports.view:read" },
    ],
  },
  {
    id: "self",
    labelKey: "nav.selfService",
    icon: "UserCircle",
    items: [
      { labelKey: "self.myProfile", href: "/me/profile", always: true },
      { labelKey: "self.myLeaves", href: "/me/leaves", always: true },
      { labelKey: "self.myRequests", href: "/me/requests", always: true },
      { labelKey: "self.security", href: "/me/security", always: true },
    ],
  },
  {
    id: "hr",
    labelKey: "nav.hr",
    icon: "Users",
    items: [
      { labelKey: "hr.dashboard", href: "/hr", permission: "hr.dashboard:read" },
      { labelKey: "hr.employees", href: "/hr/employees", permission: "hr.employees:read" },
      { labelKey: "hr.contracts", href: "/hr/contracts", permission: "hr.contracts:read" },
      { labelKey: "hr.leaves", href: "/hr/leaves", permission: "hr.leaves:read" },
      { labelKey: "hr.requests", href: "/hr/requests", permission: "hr.requests:read" },
      { labelKey: "hr.custody", href: "/hr/custody", permission: "hr.custody:read" },
      { labelKey: "hr.licenses", href: "/hr/licenses", permission: "hr.licenses:read" },
      { labelKey: "hr.payroll", href: "/hr/payroll", permission: "hr.payroll:read" },
      { labelKey: "hr.attendance", href: "/hr/attendance", permission: "hr.attendance:read" },
      { labelKey: "hr.leaveTypes", href: "/hr/leave-types", permission: "hr.leaveTypes:read" },
      { labelKey: "hr.tasks", href: "/hr/tasks", permission: "hr.tasks:read" },
      { labelKey: "hr.complaints", href: "/hr/complaints", permission: "hr.complaints:read" },
    ],
  },
  {
    id: "fleet",
    labelKey: "nav.fleet",
    icon: "Truck",
    items: [
      { labelKey: "fleet.dashboard", href: "/fleet", permission: "fleet.dashboard:read" },
      { labelKey: "fleet.vehicles", href: "/fleet/vehicles", permission: "fleet.vehicles:read" },
      {
        labelKey: "fleet.authorizations",
        href: "/fleet/authorizations",
        permission: "fleet.authorizations:read",
      },
      { labelKey: "fleet.maintenance", href: "/fleet/maintenance", permission: "fleet.maintenance:read" },
      { labelKey: "fleet.accidents", href: "/fleet/accidents", permission: "fleet.accidents:read" },
    ],
  },
  {
    id: "ops",
    labelKey: "nav.operations",
    icon: "Boxes",
    items: [
      { labelKey: "ops.dashboard", href: "/ops", permission: "ops.dashboard:read" },
      { labelKey: "ops.orders", href: "/ops/orders", permission: "ops.orders:read" },
      { labelKey: "ops.projects", href: "/ops/projects", permission: "ops.projects:read" },
      { labelKey: "ops.accounts", href: "/ops/accounts", permission: "ops.accounts:read" },
    ],
  },
  {
    id: "finance",
    labelKey: "nav.finance",
    icon: "Wallet",
    items: [
      { labelKey: "finance.dashboard", href: "/finance", permission: "finance.dashboard:read" },
      { labelKey: "finance.transactions", href: "/finance/transactions", permission: "finance.transactions:read" },
    ],
  },
  {
    id: "procurement",
    labelKey: "nav.procurement",
    icon: "ShoppingCart",
    items: [
      { labelKey: "procurement.dashboard", href: "/procurement", permission: "procurement.dashboard:read" },
      { labelKey: "procurement.orders", href: "/procurement/orders", permission: "procurement.orders:read" },
      { labelKey: "procurement.inventory", href: "/procurement/inventory", permission: "procurement.inventory:read" },
      { labelKey: "procurement.movements", href: "/procurement/movements", permission: "procurement.movements:read" },
      { labelKey: "procurement.warehouses", href: "/procurement/warehouses", permission: "procurement.warehouses:read" },
    ],
  },
  {
    id: "crm",
    labelKey: "nav.crm",
    icon: "Building2",
    items: [
      { labelKey: "crm.dashboard", href: "/crm", permission: "crm.dashboard:read" },
      { labelKey: "crm.companies", href: "/crm/companies", permission: "crm.companies:read" },
      { labelKey: "crm.contacts", href: "/crm/contacts", permission: "crm.contacts:read" },
      { labelKey: "crm.deals", href: "/crm/deals", permission: "crm.deals:read" },
      { labelKey: "crm.pipeline", href: "/crm/pipeline", permission: "crm.deals:read" },
    ],
  },
  {
    id: "sales",
    labelKey: "nav.sales",
    icon: "TrendingUp",
    items: [
      { labelKey: "sales.dashboard", href: "/sales", permission: "sales.dashboard:read" },
      { labelKey: "sales.targets", href: "/sales/targets", permission: "sales.targets:read" },
    ],
  },
  {
    id: "cms",
    labelKey: "nav.cms",
    icon: "Globe",
    items: [
      { labelKey: "cms.pages", href: "/cms", permission: "cms.pages:read" },
      { labelKey: "cms.articles", href: "/cms/articles", permission: "cms.articles:read" },
      { labelKey: "cms.clients", href: "/cms/clients", permission: "cms.clients:read" },
      { labelKey: "cms.jobs", href: "/cms/jobs", permission: "cms.jobs:read" },
      { labelKey: "cms.submissions", href: "/cms/submissions", permission: "cms.submissions:read" },
      { labelKey: "cms.seo", href: "/cms/seo", permission: "cms.seo:read" },
    ],
  },
  {
    id: "admin",
    labelKey: "nav.admin",
    icon: "Shield",
    items: [
      { labelKey: "admin.users", href: "/admin/users", permission: "admin.users:read" },
      { labelKey: "admin.roles", href: "/admin/roles", permission: "admin.roles:read" },
      { labelKey: "admin.audit", href: "/admin/audit", permission: "admin.audit:read" },
    ],
  },
];
