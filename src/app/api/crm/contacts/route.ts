import { collectionRoute } from "@/lib/crudFactory";
import { Contact } from "@/models/Contact";
import { CreateContactSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { IContact } from "@/models/Contact";

export const runtime = "nodejs";

export const contactSpec: ListSpec<IContact> = {
  searchFields: ["name", "email", "phone"],
  filterMap: {
    company: (v) => ({ company: v }),
  },
  sortable: ["name", "createdAt"],
  defaultSort: "name",
  populate: [{ path: "company", select: "name nameAr" }],
};

export const { GET, POST } = collectionRoute({
  model: Contact,
  resource: "crm.contacts",
  listSpec: contactSpec,
  createSchema: CreateContactSchema,
  updateSchema: CreateContactSchema,
  label: (d) => String(d.name ?? ""),
  beforeWrite: (data) => {
    for (const k of Object.keys(data)) if (data[k] === "") data[k] = null;
    return data;
  },
});
