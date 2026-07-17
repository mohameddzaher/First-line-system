import { itemRoute } from "@/lib/crudFactory";
import { License } from "@/models/License";
import { CreateLicenseSchema, UpdateLicenseSchema } from "@/lib/validators";
import { licenseSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: License,
  resource: "hr.licenses",
  listSpec: licenseSpec,
  createSchema: CreateLicenseSchema,
  updateSchema: UpdateLicenseSchema,
  label: (d) => String(d.name ?? ""),
});
