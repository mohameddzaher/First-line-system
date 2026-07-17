import { collectionRoute } from "@/lib/crudFactory";
import { Accident } from "@/models/Accident";
import { Vehicle } from "@/models/Vehicle";
import { CreateAccidentSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { IAccident } from "@/models/Accident";

export const runtime = "nodejs";

export const accidentSpec: ListSpec<IAccident> = {
  searchFields: ["description", "location", "reportNumber"],
  refSearch: [{ localField: "vehicle", model: () => Vehicle, fields: ["plateNumber", "makeModel"] }],
  filterMap: {
    status: (v) => ({ status: v }),
    severity: (v) => ({ severity: v }),
    atFault: (v) => ({ atFault: v }),
  },
  sortable: ["date", "severity", "status", "createdAt"],
  defaultSort: "date",
  populate: [
    { path: "vehicle", select: "plateNumber type" },
    { path: "employee", select: "nameAr employeeNumber" },
  ],
};

export const { GET, POST } = collectionRoute({
  model: Accident,
  resource: "fleet.accidents",
  listSpec: accidentSpec,
  createSchema: CreateAccidentSchema,
  updateSchema: CreateAccidentSchema,
  label: (d) => `accident ${d.reportNumber ?? ""}`,
  beforeWrite: (data) => {
    if (data.employee === "") data.employee = null;
    return data;
  },
});
