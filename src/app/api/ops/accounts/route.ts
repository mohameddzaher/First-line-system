import { collectionRoute } from "@/lib/crudFactory";
import { ThirdPartyAccount } from "@/models/ThirdPartyAccount";
import { CreateAccountSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { IThirdPartyAccount } from "@/models/ThirdPartyAccount";

export const runtime = "nodejs";

export const accountSpec: ListSpec<IThirdPartyAccount> = {
  searchFields: ["username", "externalId", "phone"],
  filterMap: {
    project: (v) => ({ project: v }),
    status: (v) => ({ status: v }),
  },
  sortable: ["username", "status", "createdAt"],
  defaultSort: "createdAt",
  populate: [
    { path: "project", select: "nameAr nameEn" },
    { path: "assignments.employee", select: "nameAr employeeNumber" },
  ],
};

export const { GET, POST } = collectionRoute({
  model: ThirdPartyAccount,
  resource: "ops.accounts",
  listSpec: accountSpec,
  createSchema: CreateAccountSchema,
  updateSchema: CreateAccountSchema,
  label: (d) => String(d.username ?? ""),
});
