import { itemRoute } from "@/lib/crudFactory";
import { SalesTarget } from "@/models/SalesTarget";
import { CreateTargetSchema, UpdateTargetSchema } from "@/lib/validators";
import { targetSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: SalesTarget,
  resource: "sales.targets",
  listSpec: targetSpec,
  createSchema: CreateTargetSchema,
  updateSchema: UpdateTargetSchema,
  label: (d) => String(d.period ?? ""),
});
