import { collectionRoute } from "@/lib/crudFactory";
import { License } from "@/models/License";
import { CreateLicenseSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { ILicense } from "@/models/License";

export const runtime = "nodejs";

export const licenseSpec: ListSpec<ILicense> = {
  searchFields: ["name", "category", "location", "number"],
  filterMap: {
    category: (v) => ({ category: v }),
    location: (v) => ({ location: v }),
  },
  sortable: ["name", "category", "expiryDate", "location", "createdAt"],
  defaultSort: "expiryDate",
};

export const { GET, POST } = collectionRoute({
  model: License,
  resource: "hr.licenses",
  listSpec: licenseSpec,
  createSchema: CreateLicenseSchema,
  updateSchema: CreateLicenseSchema,
  label: (d) => String(d.name ?? ""),
});
