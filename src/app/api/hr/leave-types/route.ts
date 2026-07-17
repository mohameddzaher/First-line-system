import { collectionRoute } from "@/lib/crudFactory";
import { LeaveType } from "@/models/LeaveType";
import { CreateLeaveTypeSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { ILeaveType } from "@/models/LeaveType";

export const runtime = "nodejs";

export const leaveTypeSpec: ListSpec<ILeaveType> = {
  searchFields: ["nameAr", "nameEn", "code"],
  filterMap: {
    paid: (v) => ({ paid: v === "true" }),
    affectsBalance: (v) => ({ affectsBalance: v === "true" }),
    isActive: (v) => ({ isActive: v === "true" }),
  },
  sortable: ["nameAr", "nameEn", "code", "createdAt"],
  defaultSort: "nameAr",
};

export const { GET, POST } = collectionRoute({
  model: LeaveType,
  resource: "hr.leaveTypes",
  listSpec: leaveTypeSpec,
  createSchema: CreateLeaveTypeSchema,
  updateSchema: CreateLeaveTypeSchema,
  label: (d) => String(d.nameAr ?? d.nameEn ?? ""),
});
