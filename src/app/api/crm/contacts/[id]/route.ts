import { itemRoute } from "@/lib/crudFactory";
import { Contact } from "@/models/Contact";
import { CreateContactSchema, UpdateContactSchema } from "@/lib/validators";
import { contactSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: Contact,
  resource: "crm.contacts",
  listSpec: contactSpec,
  createSchema: CreateContactSchema,
  updateSchema: UpdateContactSchema,
  label: (d) => String(d.name ?? ""),
  beforeWrite: (data) => {
    for (const k of Object.keys(data)) if (data[k] === "") data[k] = null;
    return data;
  },
});
