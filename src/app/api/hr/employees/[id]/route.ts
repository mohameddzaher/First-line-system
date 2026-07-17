import { itemRoute } from "@/lib/crudFactory";
import { Employee } from "@/models/Employee";
import { UpdateEmployeeSchema, CreateEmployeeSchema } from "@/lib/validators";
import { employeeListSpec, employeeLabel, normalizeEmployee } from "../shared";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: Employee,
  resource: "hr.employees",
  listSpec: employeeListSpec,
  createSchema: CreateEmployeeSchema,
  updateSchema: UpdateEmployeeSchema,
  label: employeeLabel,
  beforeWrite: (data) => normalizeEmployee(data),
});
