import { collectionRoute } from "@/lib/crudFactory";
import { Company } from "@/models/Company";
import { CreateCompanySchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { ICompany } from "@/models/Company";

export const runtime = "nodejs";

export const companySpec: ListSpec<ICompany> = {
  searchFields: ["name", "nameAr", "email", "crNumber", "city"],
  filterMap: {
    kind: (v) => ({ kind: v }),
    status: (v) => ({ status: v }),
    city: (v) => ({ city: v }),
  },
  sortable: ["name", "status", "kind", "createdAt"],
  defaultSort: "name",
  populate: [{ path: "owner", select: "firstName lastName" }],
};

export const { GET, POST } = collectionRoute({
  model: Company,
  resource: "crm.companies",
  listSpec: companySpec,
  createSchema: CreateCompanySchema,
  updateSchema: CreateCompanySchema,
  label: (d) => String(d.name ?? ""),
  beforeWrite: (data) => {
    for (const k of Object.keys(data)) if (data[k] === "") data[k] = null;
    return data;
  },
});
