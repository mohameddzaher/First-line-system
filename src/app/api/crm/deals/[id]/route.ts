import { itemRoute } from "@/lib/crudFactory";
import { Deal } from "@/models/Deal";
import { CreateDealSchema, UpdateDealSchema } from "@/lib/validators";
import { dealSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: Deal,
  resource: "crm.deals",
  listSpec: dealSpec,
  createSchema: CreateDealSchema,
  updateSchema: UpdateDealSchema,
  label: (d) => String(d.title ?? ""),
  beforeWrite: (data) => {
    for (const k of Object.keys(data)) if (data[k] === "") data[k] = null;
    if (data.stage === "won" || data.stage === "lost") {
      data.closedDate = new Date();
      data.probability = data.stage === "won" ? 100 : 0;
    }
    return data;
  },
});
