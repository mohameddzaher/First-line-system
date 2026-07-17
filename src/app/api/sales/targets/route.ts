import { collectionRoute } from "@/lib/crudFactory";
import { SalesTarget } from "@/models/SalesTarget";
import { CreateTargetSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { ISalesTarget } from "@/models/SalesTarget";

export const runtime = "nodejs";

export const targetSpec: ListSpec<ISalesTarget> = {
  searchFields: ["period"],
  filterMap: { owner: (v) => ({ owner: v }), period: (v) => ({ period: v }) },
  sortable: ["period", "targetAmount", "createdAt"],
  defaultSort: "period",
  populate: [{ path: "owner", select: "firstName lastName" }],
};

export const { GET, POST } = collectionRoute({
  model: SalesTarget,
  resource: "sales.targets",
  listSpec: targetSpec,
  createSchema: CreateTargetSchema,
  updateSchema: CreateTargetSchema,
  label: (d) => String(d.period ?? ""),
});
