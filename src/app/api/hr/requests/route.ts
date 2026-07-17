import { collectionRoute } from "@/lib/crudFactory";
import { EmployeeRequest } from "@/models/EmployeeRequest";
import { Employee } from "@/models/Employee";
import { CreateRequestSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { IEmployeeRequest } from "@/models/EmployeeRequest";

export const runtime = "nodejs";

export const requestSpec: ListSpec<IEmployeeRequest> = {
  searchFields: ["subject", "body"],
  refSearch: [
    { localField: "employee", model: () => Employee, fields: ["nameAr", "nameEn", "idNumber", "employeeNumber"] },
  ],
  filterMap: {
    status: (v) => ({ status: v }),
    category: (v) => ({ category: v }),
    employee: (v) => ({ employee: v }),
  },
  sortable: ["subject", "status", "category", "createdAt", "updatedAt"],
  defaultSort: "createdAt",
  populate: [{ path: "employee", select: "nameAr employeeNumber idNumber" }],
};

export const { GET, POST } = collectionRoute({
  model: EmployeeRequest,
  resource: "hr.requests",
  listSpec: requestSpec,
  createSchema: CreateRequestSchema,
  updateSchema: CreateRequestSchema,
  label: (d) => String(d.subject ?? ""),
});
