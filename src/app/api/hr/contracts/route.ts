import { collectionRoute } from "@/lib/crudFactory";
import { Contract } from "@/models/Contract";
import { Employee } from "@/models/Employee";
import { CreateContractSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { IContract } from "@/models/Contract";

export const runtime = "nodejs";

export const contractSpec: ListSpec<IContract> = {
  searchFields: ["type"],
  refSearch: [
    { localField: "employee", model: () => Employee, fields: ["nameAr", "nameEn", "idNumber", "employeeNumber"] },
  ],
  filterMap: {
    status: (v) => ({ status: v }),
    type: (v) => ({ type: v }),
    employee: (v) => ({ employee: v }),
  },
  sortable: ["startDate", "endDate", "status", "createdAt"],
  defaultSort: "createdAt",
  populate: [{ path: "employee", select: "nameAr employeeNumber idNumber" }],
};

export const { GET, POST } = collectionRoute({
  model: Contract,
  resource: "hr.contracts",
  listSpec: contractSpec,
  createSchema: CreateContractSchema,
  updateSchema: CreateContractSchema,
  label: (d) => `${d.type ?? "contract"}`,
});
