import { collectionRoute } from "@/lib/crudFactory";
import { Project } from "@/models/Project";
import { CreateProjectSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { IProject } from "@/models/Project";

export const runtime = "nodejs";

export const projectSpec: ListSpec<IProject> = {
  searchFields: ["nameAr", "nameEn", "code"],
  filterMap: { isActive: (v) => ({ isActive: v === "true" }) },
  sortable: ["nameAr", "code", "createdAt"],
  defaultSort: "nameAr",
  populate: [{ path: "client", select: "nameAr nameEn" }],
};

export const { GET, POST } = collectionRoute({
  model: Project,
  resource: "ops.projects",
  listSpec: projectSpec,
  createSchema: CreateProjectSchema,
  updateSchema: CreateProjectSchema,
  label: (d) => String(d.nameAr ?? ""),
  beforeWrite: (data) => {
    if (data.client === "") data.client = null;
    return data;
  },
});
