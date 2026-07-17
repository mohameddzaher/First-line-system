import { itemRoute } from "@/lib/crudFactory";
import { ClientLogo } from "@/models/ClientLogo";
import { CreateClientSchema, UpdateClientSchema } from "@/lib/validators";
import { clientSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: ClientLogo,
  resource: "cms.clients",
  listSpec: clientSpec,
  createSchema: CreateClientSchema,
  updateSchema: UpdateClientSchema,
  label: (d) => String(d.name ?? ""),
});
