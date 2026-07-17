import { itemRoute } from "@/lib/crudFactory";
import { Task } from "@/models/Task";
import { CreateTaskSchema, UpdateTaskSchema } from "@/lib/validators";
import { taskSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: Task,
  resource: "hr.tasks",
  listSpec: taskSpec,
  createSchema: CreateTaskSchema,
  updateSchema: UpdateTaskSchema,
  label: (d) => String(d.title ?? ""),
  beforeWrite: (data) => {
    if (data.assignedTo === "") data.assignedTo = null;
    if (data.relatedEmployee === "") data.relatedEmployee = null;
    if (data.status === "done" || data.status === "cancelled") data.resolvedAt = new Date();
    return data;
  },
});
