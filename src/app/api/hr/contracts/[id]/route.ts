import { itemRoute } from "@/lib/crudFactory";
import { Contract } from "@/models/Contract";
import { CreateContractSchema, UpdateContractSchema } from "@/lib/validators";
import { contractSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: Contract,
  resource: "hr.contracts",
  listSpec: contractSpec,
  createSchema: CreateContractSchema,
  updateSchema: UpdateContractSchema,
  label: (d) => `${d.type ?? "contract"}`,
});
