import { collectionRoute } from "@/lib/crudFactory";
import { Deal } from "@/models/Deal";
import { Company } from "@/models/Company";
import { CreateDealSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { IDeal } from "@/models/Deal";

export const runtime = "nodejs";

export const dealSpec: ListSpec<IDeal> = {
  searchFields: ["title"],
  refSearch: [{ localField: "company", model: () => Company, fields: ["name", "nameAr"] }],
  filterMap: {
    stage: (v) => ({ stage: v }),
    owner: (v) => ({ owner: v }),
    company: (v) => ({ company: v }),
  },
  sortable: ["title", "stage", "value", "expectedCloseDate", "createdAt"],
  defaultSort: "createdAt",
  populate: [
    { path: "company", select: "name nameAr" },
    { path: "owner", select: "firstName lastName" },
  ],
};

/** Won/lost deals get a closed date so pipeline metrics exclude them. */
function stampClose(data: Record<string, unknown>): Record<string, unknown> {
  for (const k of Object.keys(data)) if (data[k] === "") data[k] = null;
  if (data.stage === "won" || data.stage === "lost") {
    data.closedDate = new Date();
    if (data.stage === "won") data.probability = 100;
    if (data.stage === "lost") data.probability = 0;
  }
  return data;
}

export const { GET, POST } = collectionRoute({
  model: Deal,
  resource: "crm.deals",
  listSpec: dealSpec,
  createSchema: CreateDealSchema,
  updateSchema: CreateDealSchema,
  label: (d) => String(d.title ?? ""),
  beforeWrite: (data) => stampClose(data),
});
