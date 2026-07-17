import { collectionRoute } from "@/lib/crudFactory";
import { Job } from "@/models/Job";
import { CreateJobSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { IJob } from "@/models/Job";

export const runtime = "nodejs";

export const jobSpec: ListSpec<IJob> = {
  searchFields: ["title_ar", "title_en", "department"],
  filterMap: { published: (v) => ({ published: v === "true" }), type: (v) => ({ type: v }) },
  sortable: ["title_en", "published", "createdAt"],
  defaultSort: "createdAt",
};

export const { GET, POST } = collectionRoute({
  model: Job,
  resource: "cms.jobs",
  listSpec: jobSpec,
  createSchema: CreateJobSchema,
  updateSchema: CreateJobSchema,
  label: (d) => String(d.title_en ?? d.title_ar ?? ""),
});
