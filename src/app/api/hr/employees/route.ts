import { collectionRoute } from "@/lib/crudFactory";
import { Employee } from "@/models/Employee";
import { CreateEmployeeSchema } from "@/lib/validators";
import { employeeListSpec, employeeLabel, normalizeEmployee } from "./shared";

export const runtime = "nodejs";

export const { GET, POST } = collectionRoute({
  model: Employee,
  resource: "hr.employees",
  listSpec: employeeListSpec,
  createSchema: CreateEmployeeSchema,
  updateSchema: CreateEmployeeSchema,
  label: employeeLabel,
  beforeWrite: (data) => normalizeEmployee(data),
});
