import { guard, ok, readBody } from "@/lib/api";
import { EmployeeRequest } from "@/models/EmployeeRequest";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

export const runtime = "nodejs";

const SelfRequestSchema = z.object({
  category: z.enum([
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
  ]),
  subject: z.string().trim().min(1),
  body: z.string().trim().optional(),
});

export const GET = guard({ authOnly: true }, async ({ user }) => {
  if (!user.employeeId) return ok({ rows: [], total: 0 });
  const rows = await EmployeeRequest.find({ employee: user.employeeId })
    .sort({ createdAt: -1 })
    .lean();
  return ok({ rows, total: rows.length });
});

export const POST = guard({ authOnly: true }, async ({ request, user }) => {
  if (!user.employeeId) return ok({ error: "NO_EMPLOYEE" }, 400);
  const body = await readBody(request, SelfRequestSchema);

  const created = await EmployeeRequest.create({
    employee: user.employeeId,
    category: body.category,
    subject: body.subject,
    body: body.body,
    status: "open",
    createdBy: user.id,
  });

  await writeAudit({
    actor: user,
    action: "create",
    resource: "hr.requests",
    resourceId: String(created._id),
    resourceLabel: `${body.subject} (self)`,
    meta: { self: true },
  });

  return ok(created.toObject(), 201);
});
