import { itemRoute } from "@/lib/crudFactory";
import { FinanceTransaction } from "@/models/FinanceTransaction";
import { CreateTransactionSchema, UpdateTransactionSchema } from "@/lib/validators";
import { txnSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: FinanceTransaction,
  resource: "finance.transactions",
  listSpec: txnSpec,
  createSchema: CreateTransactionSchema,
  updateSchema: UpdateTransactionSchema,
  label: (d) => String(d.reference ?? ""),
  beforeWrite: (data) => {
    if (data.project === "") data.project = null;
    if (data.company === "") data.company = null;
    return data;
  },
});
