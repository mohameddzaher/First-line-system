import { itemRoute } from "@/lib/crudFactory";
import { Job } from "@/models/Job";
import { CreateJobSchema, UpdateJobSchema } from "@/lib/validators";
import { jobSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: Job,
  resource: "cms.jobs",
  listSpec: jobSpec,
  createSchema: CreateJobSchema,
  updateSchema: UpdateJobSchema,
  label: (d) => String(d.title_en ?? d.title_ar ?? ""),
});
