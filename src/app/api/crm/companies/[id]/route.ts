import { itemRoute } from "@/lib/crudFactory";
import { Company } from "@/models/Company";
import { CreateCompanySchema, UpdateCompanySchema } from "@/lib/validators";
import { companySpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: Company,
  resource: "crm.companies",
  listSpec: companySpec,
  createSchema: CreateCompanySchema,
  updateSchema: UpdateCompanySchema,
  label: (d) => String(d.name ?? ""),
  beforeWrite: (data) => {
    for (const k of Object.keys(data)) if (data[k] === "") data[k] = null;
    return data;
  },
});
