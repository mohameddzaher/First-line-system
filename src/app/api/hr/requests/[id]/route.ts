import { itemRoute } from "@/lib/crudFactory";
import { EmployeeRequest } from "@/models/EmployeeRequest";
import { CreateRequestSchema, UpdateRequestSchema } from "@/lib/validators";
import { requestSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: EmployeeRequest,
  resource: "hr.requests",
  listSpec: requestSpec,
  createSchema: CreateRequestSchema,
  updateSchema: UpdateRequestSchema,
  label: (d) => String(d.subject ?? ""),
  beforeWrite: (data) => {
    if (data.assignedTo === "") data.assignedTo = null;
    if (data.status === "resolved" || data.status === "closed") data.resolvedAt = new Date();
    return data;
  },
});
