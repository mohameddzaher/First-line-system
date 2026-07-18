import { collectionRoute } from "@/lib/crudFactory";
import { FinanceTransaction } from "@/models/FinanceTransaction";
import { CreateTransactionSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { IFinanceTransaction } from "@/models/FinanceTransaction";

export const runtime = "nodejs";

export const txnSpec: ListSpec<IFinanceTransaction> = {
  searchFields: ["reference", "category", "description", "method"],
  filterMap: {
    kind: (v) => ({ kind: v }),
    status: (v) => ({ status: v }),
    category: (v) => ({ category: v }),
    project: (v) => ({ project: v }),
  },
  sortable: ["reference", "kind", "amount", "date", "createdAt"],
  defaultSort: "date",
  populate: [
    { path: "project", select: "nameAr nameEn" },
    { path: "company", select: "name nameAr" },
  ],
};

export const { GET, POST } = collectionRoute({
  model: FinanceTransaction,
  resource: "finance.transactions",
  listSpec: txnSpec,
  createSchema: CreateTransactionSchema,
  updateSchema: CreateTransactionSchema,
  label: (d) => String(d.reference ?? ""),
  beforeWrite: (data) => {
    if (data.project === "") data.project = null;
    if (data.company === "") data.company = null;
    return data;
  },
});
