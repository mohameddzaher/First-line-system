import { collectionRoute } from "@/lib/crudFactory";
import { Vehicle } from "@/models/Vehicle";
import { CreateVehicleSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { IVehicle } from "@/models/Vehicle";

export const runtime = "nodejs";

export const vehicleSpec: ListSpec<IVehicle> = {
  searchFields: ["plateNumber", "plateLatin", "makeModel", "make", "color", "chassisNumber", "city"],
  filterMap: {
    type: (v) => ({ type: v }),
    status: (v) => ({ status: v }),
    city: (v) => ({ city: v }),
    serviceTier: (v) => ({ serviceTier: v }),
    department: (v) => ({ department: v }),
    project: (v) => ({ project: v }),
  },
  sortable: ["plateNumber", "type", "status", "city", "createdAt"],
  defaultSort: "createdAt",
  populate: [
    { path: "department", select: "nameAr nameEn" },
    { path: "project", select: "nameAr nameEn" },
    { path: "currentAuthorization.employee", select: "nameAr employeeNumber" },
  ],
};

export const { GET, POST } = collectionRoute({
  model: Vehicle,
  resource: "fleet.vehicles",
  listSpec: vehicleSpec,
  createSchema: CreateVehicleSchema,
  updateSchema: CreateVehicleSchema,
  label: (d) => String(d.plateNumber ?? ""),
  beforeWrite: (data) => {
    if (data.department === "") data.department = null;
    if (data.project === "") data.project = null;
    return data;
  },
});
