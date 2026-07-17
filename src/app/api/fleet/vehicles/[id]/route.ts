import { itemRoute } from "@/lib/crudFactory";
import { Vehicle } from "@/models/Vehicle";
import { CreateVehicleSchema, UpdateVehicleSchema } from "@/lib/validators";
import { vehicleSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: Vehicle,
  resource: "fleet.vehicles",
  listSpec: vehicleSpec,
  createSchema: CreateVehicleSchema,
  updateSchema: UpdateVehicleSchema,
  label: (d) => String(d.plateNumber ?? ""),
  beforeWrite: (data) => {
    if (data.department === "") data.department = null;
    if (data.project === "") data.project = null;
    return data;
  },
});
