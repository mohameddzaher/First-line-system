import { z } from "zod";
import { ROLE_KEYS } from "@/lib/rbac";

/** Reusable primitives shared across every module's schemas. */

// Accepts a 24-hex id, or "" / null / undefined which all normalise to null.
// This lets a form clear a reference (e.g. return custody to the warehouse) by
// submitting an empty string.
export const objectId = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^[0-9a-fA-F]{24}$/.test(v), "Invalid id");

export const requiredObjectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

/** Accepts "", null, or an ISO/date string; normalises to Date | null. */
export const optionalDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v ? new Date(v) : null))
  .refine((v) => v === null || !Number.isNaN(v.getTime()), "Invalid date");

export const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || undefined);

/**
 * PATCH-safe variants. `objectId` and `optionalDate` normalise an absent value
 * to null, which is right on create but destructive on update: a status-only
 * PATCH would blank every field the client didn't resend. Wrapping them in
 * .optional() short-circuits before the transform, so an absent key stays
 * undefined and the existing value is left alone.
 */
export const patchObjectId = objectId.optional();
export const patchDate = optionalDate.optional();
export const patchString = optionalString.optional();

/**
 * Derives a PATCH schema from a create schema.
 *
 * `.partial()` on its own is not enough: it makes every key optional but keeps
 * each key's `.default()`, so any field the client omits is silently rewritten
 * to its default. That is how renaming an inventory item zeroed its stock,
 * editing an article title blanked its body, and a user PATCH could re-enable a
 * disabled account. Stripping the defaults first makes an absent key mean
 * "leave this alone", which is what PATCH is supposed to mean.
 */
export function toPatchSchema<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  const source = schema.shape as unknown as Record<string, z.ZodTypeAny>;
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const key of Object.keys(source)) {
    const field = source[key];
    shape[key] =
      field instanceof z.ZodDefault ? (field.removeDefault() as unknown as z.ZodTypeAny) : field;
  }
  // The cast restores the precise per-key types. It is accurate rather than a
  // convenience: .partial() and this both make every key optional — the only
  // difference is that the defaults no longer fire at runtime.
  return z.object(shape).partial() as unknown as ReturnType<z.ZodObject<T>["partial"]>;
}


export const money = z
  .union([z.number(), z.string()])
  .optional()
  .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
  .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0), "Invalid amount");

export const CreateUserSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  role: z.enum(ROLE_KEYS as [string, ...string[]]),
  employee: objectId,
  directManager: objectId,
  assignedCustomers: z.array(requiredObjectId).default([]),
  extraPermissions: z.array(z.string()).default([]),
  deniedPermissions: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

const DocumentSchema = z.object({
  type: z.enum([
    "iqama",
    "passport",
    "visa",
    "driving_license",
    "national_id",
    "medical_insurance",
    "work_permit",
    "contract",
    "other",
  ]),
  number: optionalString,
  issueDate: optionalDate,
  expiryDate: optionalDate,
  fileUrl: optionalString,
  notes: optionalString,
});

export const CreateEmployeeSchema = z.object({
  nameAr: z.string().trim().min(1, "الاسم مطلوب").max(120),
  nameEn: optionalString,
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  phone: optionalString,
  status: z.enum(["active", "on_leave", "suspended", "terminated"]).default("active"),
  employeeNumber: optionalString,

  idType: z.enum(["iqama", "national_id"]).default("iqama"),
  idNumber: z.string().trim().min(1, "رقم الهوية مطلوب"),
  nationality: z.string().trim().min(1, "الجنسية مطلوبة"),
  isSaudi: z.boolean().default(false),
  dateOfBirth: optionalDate,
  passportNumber: optionalString,
  absherNumber: optionalString,
  absherStatus: optionalString,
  professionOnIqama: optionalString,

  jobTitle: optionalString,
  department: objectId,
  project: objectId,
  workLocation: optionalString,
  hireDate: optionalDate,
  actualWorkStartDate: optionalDate,
  sponsorshipType: z.enum(["company", "freelancer", "external"]).default("company"),
  isDriver: z.boolean().default(false),

  basicSalary: money,
  housingAllowance: money,
  transportAllowance: money,
  otherAllowance: money,
  iban: optionalString,
  bank: optionalString,
  penaltyClause: money,

  crNumber: optionalString,
  insuranceCompany: optionalString,
  socialInsuranceStatus: optionalString,
  fileStatus: optionalString,

  documents: z.array(DocumentSchema).default([]),
  notes: optionalString,
});

export const UpdateEmployeeSchema = toPatchSchema(CreateEmployeeSchema);

// ── Leave Types ──────────────────────────────────────────────
export const CreateLeaveTypeSchema = z.object({
  nameAr: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  code: z.string().trim().min(1).toLowerCase(),
  paid: z.boolean().default(true),
  affectsBalance: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export const UpdateLeaveTypeSchema = toPatchSchema(CreateLeaveTypeSchema);

// ── Departments ──────────────────────────────────────────────
export const CreateDepartmentSchema = z.object({
  nameAr: z.string().trim().min(1),
  nameEn: z.string().trim().optional(),
  code: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});
export const UpdateDepartmentSchema = toPatchSchema(CreateDepartmentSchema);

// ── Contracts ────────────────────────────────────────────────
export const CreateContractSchema = z.object({
  employee: requiredObjectId,
  type: z.enum(["fixed", "unlimited", "part_time", "temporary"]).default("fixed"),
  startDate: z.string().min(1).transform((v) => new Date(v)),
  endDate: optionalDate,
  annualLeaveDays: z.coerce.number().min(0).default(30),
  basicSalary: money,
  housingAllowance: money,
  transportAllowance: money,
  otherAllowance: money,
  status: z.enum(["active", "expired", "terminated", "draft"]).default("active"),
  notes: optionalString,
});
export const UpdateContractSchema = toPatchSchema(CreateContractSchema);

// ── Leaves ───────────────────────────────────────────────────
export const CreateLeaveSchema = z.object({
  employee: requiredObjectId,
  leaveType: requiredObjectId,
  startDate: z.string().min(1).transform((v) => new Date(v)),
  endDate: z.string().min(1).transform((v) => new Date(v)),
  reason: optionalString,
});
export const UpdateLeaveSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
  reviewNote: optionalString,
  reason: optionalString,
});

// ── Custody ──────────────────────────────────────────────────
export const CreateCustodySchema = z.object({
  name: z.string().trim().min(1),
  type: z
    .enum(["laptop", "phone", "vehicle", "motorcycle", "sim_card", "uniform", "tools", "access_card", "other"])
    .default("other"),
  brand: optionalString,
  serial: optionalString,
  condition: z.enum(["new", "good", "fair", "poor"]).default("good"),
  status: z.enum(["assigned", "returned", "lost", "damaged", "in_stock"]).default("in_stock"),
  employee: objectId,
  assignedDate: optionalDate,
  estimatedValue: money,
  warehouse: objectId,
  notes: optionalString,
});
export const UpdateCustodySchema = toPatchSchema(CreateCustodySchema);

// ── Licenses ─────────────────────────────────────────────────
export const CreateLicenseSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  durationLabel: optionalString,
  issueDate: optionalDate,
  expiryDate: z.string().min(1).transform((v) => new Date(v)),
  location: optionalString,
  number: optionalString,
  notes: optionalString,
  isActive: z.boolean().default(true),
});
export const UpdateLicenseSchema = toPatchSchema(CreateLicenseSchema);

// ── Employee Requests ────────────────────────────────────────
export const CreateRequestSchema = z.object({
  employee: requiredObjectId,
  category: z
    .enum([
      "salary_certificate",
      "salary_definition",
      "experience_certificate",
      "leave_balance",
      "advance",
      "loan",
      "transfer",
      "resignation",
      "complaint",
      "other",
    ])
    .default("other"),
  subject: z.string().trim().min(1),
  body: optionalString,
});
export const UpdateRequestSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "rejected", "closed"]).optional(),
  // patchObjectId, not objectId — a status-only PATCH must not unassign the
  // request just because the client didn't resend the assignee.
  assignedTo: patchObjectId,
  subject: optionalString,
  body: optionalString,
});

// ── Tasks & Complaints ───────────────────────────────────────
export const CreateTaskSchema = z.object({
  kind: z.enum(["task", "complaint"]).default("task"),
  title: z.string().trim().min(1),
  description: optionalString,
  status: z.enum(["todo", "in_progress", "done", "cancelled"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: optionalDate,
  assignedTo: objectId,
  relatedEmployee: objectId,
});
export const UpdateTaskSchema = toPatchSchema(CreateTaskSchema);

// ── Vehicles ─────────────────────────────────────────────────
export const VEHICLE_STATUS_ENUM = [
  "authorized", "available", "parked", "maintenance",
  "no_plate", "impounded", "withdrawn", "stolen", "out_of_service",
] as const;

export const CreateVehicleSchema = z.object({
  plateNumber: z.string().trim().min(1, "رقم اللوحة مطلوب"),
  plateLatin: optionalString,
  type: z.enum(["car", "motorcycle", "heavy_truck"]),
  make: optionalString,
  makeModel: optionalString,
  year: z.coerce.number().int().min(1970).max(2100).optional(),
  color: optionalString,
  status: z.enum(VEHICLE_STATUS_ENUM).default("available"),
  city: optionalString,
  chassisNumber: optionalString,
  ownership: optionalString,
  purchasePrice: money,
  serviceTier: z.enum(["standard", "express"]).default("standard"),
  conditionNote: optionalString,
  department: objectId,
  project: objectId,
  registrationExpiry: optionalDate,
  insuranceExpiry: optionalDate,
  notes: optionalString,
});
export const UpdateVehicleSchema = toPatchSchema(CreateVehicleSchema);

export const AuthorizeVehicleSchema = z.object({
  employee: requiredObjectId,
  startDate: optionalDate,
  authorizationType: z.string().trim().default("تفويض قيادة"),
  note: optionalString,
});

// ── Accidents ────────────────────────────────────────────────
export const CreateAccidentSchema = z.object({
  vehicle: requiredObjectId,
  employee: objectId,
  date: z.string().min(1).transform((v) => new Date(v)),
  description: optionalString,
  severity: z.enum(["minor", "moderate", "major", "total_loss"]).default("minor"),
  atFault: z.enum(["driver", "third_party", "shared", "undetermined"]).default("undetermined"),
  status: z.enum(["open", "under_review", "closed"]).default("open"),
  estimatedCost: money,
  actualCost: money,
  location: optionalString,
  reportNumber: optionalString,
});
export const UpdateAccidentSchema = toPatchSchema(CreateAccidentSchema).extend({
  vehicle: requiredObjectId.optional(),
});

// ── Vehicle Maintenance ──────────────────────────────────────
export const CreateMaintenanceSchema = z.object({
  vehicle: requiredObjectId,
  type: z.enum(["periodic", "repair", "tires", "oil", "accident_repair", "inspection", "other"]).default("periodic"),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  date: z.string().min(1).transform((v) => new Date(v)),
  completedDate: optionalDate,
  odometer: money,
  workshop: optionalString,
  description: optionalString,
  cost: money,
});
export const UpdateMaintenanceSchema = toPatchSchema(CreateMaintenanceSchema).extend({
  vehicle: requiredObjectId.optional(),
});

// ── Operations: Projects & Accounts ──────────────────────────
export const CreateProjectSchema = z.object({
  nameAr: z.string().trim().min(1),
  nameEn: optionalString,
  code: optionalString,
  client: objectId,
  isActive: z.boolean().default(true),
});
export const UpdateProjectSchema = toPatchSchema(CreateProjectSchema);

export const CreateAccountSchema = z.object({
  project: requiredObjectId,
  username: z.string().trim().min(1),
  externalId: optionalString,
  phone: optionalString,
  status: z.enum(["active", "idle", "suspended", "closed"]).default("idle"),
  notes: optionalString,
});
export const UpdateAccountSchema = toPatchSchema(CreateAccountSchema);

export const AssignAccountSchema = z.object({
  employee: requiredObjectId,
  shift: z.enum(["full", "morning", "evening", "night"]).default("full"),
  startDate: optionalDate,
  note: optionalString,
});

// ── Procurement: Warehouses, Inventory, POs ──────────────────
export const CreateWarehouseSchema = z.object({
  name: z.string().trim().min(1),
  location: optionalString,
  manager: objectId,
  isActive: z.boolean().default(true),
});
export const UpdateWarehouseSchema = toPatchSchema(CreateWarehouseSchema);

export const CreateInventorySchema = z.object({
  name: z.string().trim().min(1),
  sku: optionalString,
  category: optionalString,
  warehouse: requiredObjectId,
  quantity: z.coerce.number().min(0).default(0),
  reorderLevel: z.coerce.number().min(0).default(0),
  unitCost: money,
  custodyType: optionalString,
  notes: optionalString,
});
export const UpdateInventorySchema = toPatchSchema(CreateInventorySchema);

export const POLineSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
  inventoryItem: objectId,
});
export const CreatePOSchema = z.object({
  orderNumber: z.string().trim().min(1),
  supplier: requiredObjectId,
  warehouse: objectId,
  status: z.enum(["draft", "pending", "approved", "received", "cancelled"]).default("draft"),
  orderDate: optionalDate,
  expectedDate: optionalDate,
  lines: z.array(POLineSchema).default([]),
  vatRate: z.coerce.number().min(0).max(100).default(15),
  notes: optionalString,
});
// Not derived via .partial() — that would keep lines' .default([]) and vatRate's
// .default(15), so a status-only PATCH (e.g. "receive") would wipe the lines and
// zero the totals. Here lines/vatRate are absent unless explicitly sent.
export const UpdatePOSchema = z.object({
  orderNumber: z.string().trim().min(1).optional(),
  supplier: requiredObjectId.optional(),
  warehouse: patchObjectId,
  status: z.enum(["draft", "pending", "approved", "received", "cancelled"]).optional(),
  orderDate: patchDate,
  expectedDate: patchDate,
  lines: z.array(POLineSchema).optional(),
  vatRate: z.coerce.number().min(0).max(100).optional(),
  notes: patchString,
});

// ── CRM: Companies, Contacts, Deals ──────────────────────────
export const CreateCompanySchema = z.object({
  name: z.string().trim().min(1),
  nameAr: optionalString,
  kind: z.enum(["customer", "vendor", "both"]).default("customer"),
  status: z.enum(["active", "prospect", "inactive"]).default("prospect"),
  industry: optionalString,
  website: optionalString,
  phone: optionalString,
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  city: optionalString,
  crNumber: optionalString,
  vatNumber: optionalString,
  owner: objectId,
  notes: optionalString,
});
export const UpdateCompanySchema = toPatchSchema(CreateCompanySchema);

export const CreateContactSchema = z.object({
  name: z.string().trim().min(1),
  company: objectId,
  title: optionalString,
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  phone: optionalString,
  notes: optionalString,
});
export const UpdateContactSchema = toPatchSchema(CreateContactSchema);

export const CreateDealSchema = z.object({
  title: z.string().trim().min(1),
  company: objectId,
  contact: objectId,
  owner: objectId,
  stage: z.enum(["lead", "qualified", "proposal", "negotiation", "won", "lost"]).default("lead"),
  value: money,
  probability: z.coerce.number().min(0).max(100).default(10),
  expectedCloseDate: optionalDate,
  notes: optionalString,
});
export const UpdateDealSchema = toPatchSchema(CreateDealSchema);

// ── Sales Targets ────────────────────────────────────────────
export const CreateTargetSchema = z.object({
  owner: requiredObjectId,
  period: z.string().trim().min(1),
  targetAmount: z.coerce.number().min(0),
  notes: optionalString,
});
export const UpdateTargetSchema = toPatchSchema(CreateTargetSchema);

// ── Orders (last-mile delivery) ──────────────────────────────
/**
 * An order always has a placed time. `optionalDate` turns an absent value into
 * null, which would overwrite the schema default and leave the order with no
 * placed time — breaking SLA math and date sorting. Absent means "now" here.
 */
const placedAtField = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v ? new Date(v) : new Date()))
  .refine((v) => !Number.isNaN(v.getTime()), "Invalid date");

export const CreateOrderSchema = z.object({
  orderNumber: z.string().trim().min(1),
  externalId: optionalString,
  project: objectId,
  driver: objectId,
  status: z.enum(["new", "assigned", "picked_up", "in_transit", "delivered", "failed", "returned", "cancelled"]).default("new"),
  customerName: optionalString,
  customerPhone: optionalString,
  city: optionalString,
  pickupAddress: optionalString,
  dropoffAddress: optionalString,
  amount: money,
  codAmount: money,
  deliveryFee: money,
  placedAt: placedAtField,
  slaDueAt: optionalDate,
  notes: optionalString,
});
export const UpdateOrderSchema = toPatchSchema(CreateOrderSchema);
export const AssignOrderSchema = z.object({ driver: requiredObjectId });
export const OrderStatusSchema = z.object({
  status: z.enum(["new", "assigned", "picked_up", "in_transit", "delivered", "failed", "returned", "cancelled"]),
  note: optionalString,
});

// ── Finance ──────────────────────────────────────────────────
export const CreateTransactionSchema = z.object({
  reference: z.string().trim().min(1),
  kind: z.enum(["revenue", "expense"]),
  category: z.string().trim().min(1),
  amount: z.coerce.number().min(0),
  date: z.string().min(1).transform((v) => new Date(v)),
  status: z.enum(["draft", "posted", "reconciled", "void"]).default("posted"),
  project: objectId,
  company: objectId,
  method: optionalString,
  description: optionalString,
});
export const UpdateTransactionSchema = toPatchSchema(CreateTransactionSchema);

// ── Attendance ───────────────────────────────────────────────
export const CreateAttendanceSchema = z.object({
  employee: requiredObjectId,
  date: z.string().min(1).transform((v) => new Date(v)),
  status: z.enum(["present", "absent", "leave", "late", "holiday"]).default("present"),
  checkIn: optionalString,
  checkOut: optionalString,
  hours: money,
  notes: optionalString,
});
export const UpdateAttendanceSchema = toPatchSchema(CreateAttendanceSchema);

// ── Stock movement ───────────────────────────────────────────
export const CreateMovementSchema = z.object({
  item: requiredObjectId,
  type: z.enum(["in", "out", "adjustment", "transfer"]),
  quantity: z.coerce.number().min(0),
  reason: optionalString,
  reference: optionalString,
  employee: objectId,
});

// ── CMS: Articles, Jobs, Clients ─────────────────────────────
export const CreateArticleSchema = z.object({
  slug: z.string().trim().min(1).toLowerCase().regex(/^[a-z0-9-]+$/, "Slug must be url-safe"),
  title_ar: z.string().trim().min(1),
  title_en: z.string().trim().min(1),
  excerpt_ar: optionalString,
  excerpt_en: optionalString,
  body_ar: z.string().default(""),
  body_en: z.string().default(""),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
});
export const UpdateArticleSchema = toPatchSchema(CreateArticleSchema);

export const CreateJobSchema = z.object({
  title_ar: z.string().trim().min(1),
  title_en: z.string().trim().min(1),
  department: optionalString,
  location_ar: optionalString,
  location_en: optionalString,
  type: z.enum(["full_time", "part_time", "contract", "freelance"]).default("full_time"),
  description_ar: z.string().default(""),
  description_en: z.string().default(""),
  published: z.boolean().default(true),
});
export const UpdateJobSchema = toPatchSchema(CreateJobSchema);

export const CreateClientSchema = z.object({
  name: z.string().trim().min(1),
  logo: z.string().min(1),
  website: optionalString,
  order: z.coerce.number().default(0),
  active: z.boolean().default(true),
});
export const UpdateClientSchema = toPatchSchema(CreateClientSchema);

export const UpdateUserSchema = toPatchSchema(CreateUserSchema).extend({
  // Password is optional on update; empty string means "leave unchanged".
  password: z
    .string()
    .min(8)
    .max(128)
    .optional()
    .or(z.literal("")),
});
