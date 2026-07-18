import { itemRoute } from "@/lib/crudFactory";
import { Department } from "@/models/Department";
import { CreateDepartmentSchema, UpdateDepartmentSchema } from "@/lib/validators";
import { departmentSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: Department,
  resource: "hr.departments",
  listSpec: departmentSpec,
  createSchema: CreateDepartmentSchema,
  updateSchema: UpdateDepartmentSchema,
  label: (d) => String(d.nameAr ?? d.nameEn ?? ""),
});
