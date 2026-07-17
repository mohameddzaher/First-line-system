import { collectionRoute } from "@/lib/crudFactory";
import { ClientLogo } from "@/models/ClientLogo";
import { CreateClientSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { IClientLogo } from "@/models/ClientLogo";

export const runtime = "nodejs";

export const clientSpec: ListSpec<IClientLogo> = {
  searchFields: ["name"],
  filterMap: { active: (v) => ({ active: v === "true" }) },
  sortable: ["name", "order", "createdAt"],
  defaultSort: "order",
};

export const { GET, POST } = collectionRoute({
  model: ClientLogo,
  resource: "cms.clients",
  listSpec: clientSpec,
  createSchema: CreateClientSchema,
  updateSchema: CreateClientSchema,
  label: (d) => String(d.name ?? ""),
});
