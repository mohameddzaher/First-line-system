import { itemRoute } from "@/lib/crudFactory";
import { ThirdPartyAccount } from "@/models/ThirdPartyAccount";
import { CreateAccountSchema, UpdateAccountSchema } from "@/lib/validators";
import { accountSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: ThirdPartyAccount,
  resource: "ops.accounts",
  listSpec: accountSpec,
  createSchema: CreateAccountSchema,
  updateSchema: UpdateAccountSchema,
  label: (d) => String(d.username ?? ""),
});
