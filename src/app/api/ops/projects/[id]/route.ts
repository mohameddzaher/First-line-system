import { itemRoute } from "@/lib/crudFactory";
import { Project } from "@/models/Project";
import { CreateProjectSchema, UpdateProjectSchema } from "@/lib/validators";
import { projectSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: Project,
  resource: "ops.projects",
  listSpec: projectSpec,
  createSchema: CreateProjectSchema,
  updateSchema: UpdateProjectSchema,
  label: (d) => String(d.nameAr ?? ""),
  beforeWrite: (data) => {
    if (data.client === "") data.client = null;
    return data;
  },
});
