import { itemRoute } from "@/lib/crudFactory";
import { LeaveType } from "@/models/LeaveType";
import { CreateLeaveTypeSchema, UpdateLeaveTypeSchema } from "@/lib/validators";
import { leaveTypeSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: LeaveType,
  resource: "hr.leaveTypes",
  listSpec: leaveTypeSpec,
  createSchema: CreateLeaveTypeSchema,
  updateSchema: UpdateLeaveTypeSchema,
  label: (d) => String(d.nameAr ?? d.nameEn ?? ""),
});
