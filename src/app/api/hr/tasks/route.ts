import { collectionRoute } from "@/lib/crudFactory";
import { Task } from "@/models/Task";
import { CreateTaskSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { ITask } from "@/models/Task";

export const runtime = "nodejs";

export const taskSpec: ListSpec<ITask> = {
  searchFields: ["title", "description"],
  filterMap: {
    kind: (v) => ({ kind: v }),
    status: (v) => ({ status: v }),
    priority: (v) => ({ priority: v }),
  },
  sortable: ["title", "status", "priority", "dueDate", "createdAt"],
  defaultSort: "createdAt",
  populate: [
    { path: "assignedTo", select: "firstName lastName" },
    { path: "relatedEmployee", select: "nameAr employeeNumber" },
  ],
};

export const { GET, POST } = collectionRoute({
  model: Task,
  resource: "hr.tasks",
  listSpec: taskSpec,
  createSchema: CreateTaskSchema,
  updateSchema: CreateTaskSchema,
  label: (d) => String(d.title ?? ""),
  beforeWrite: (data) => {
    if (data.assignedTo === "") data.assignedTo = null;
    if (data.relatedEmployee === "") data.relatedEmployee = null;
    return data;
  },
});
