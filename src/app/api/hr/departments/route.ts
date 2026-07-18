import { collectionRoute } from "@/lib/crudFactory";
import { Department } from "@/models/Department";
import { CreateDepartmentSchema, UpdateDepartmentSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { IDepartment } from "@/models/Department";

export const runtime = "nodejs";

export const departmentSpec: ListSpec<IDepartment> = {
  searchFields: ["nameAr", "nameEn", "code"],
  filterMap: {
    isActive: (v) => ({ isActive: v === "true" }),
  },
  sortable: ["nameAr", "nameEn", "code", "createdAt"],
  defaultSort: "nameAr",
};

export const { GET, POST } = collectionRoute({
  model: Department,
  resource: "hr.departments",
  listSpec: departmentSpec,
  createSchema: CreateDepartmentSchema,
  updateSchema: UpdateDepartmentSchema,
  label: (d) => String(d.nameAr ?? d.nameEn ?? ""),
});
