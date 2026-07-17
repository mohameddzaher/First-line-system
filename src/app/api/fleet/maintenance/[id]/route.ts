import { itemRoute } from "@/lib/crudFactory";
import { Maintenance } from "@/models/Maintenance";
import { Vehicle } from "@/models/Vehicle";
import { CreateMaintenanceSchema, UpdateMaintenanceSchema } from "@/lib/validators";
import { maintenanceSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: Maintenance,
  resource: "fleet.maintenance",
  listSpec: maintenanceSpec,
  createSchema: CreateMaintenanceSchema,
  updateSchema: UpdateMaintenanceSchema,
  label: (d) => `maintenance ${d.type ?? ""}`,
  beforeWrite: (data) => {
    if (data.status === "completed" && !data.completedDate) data.completedDate = new Date();
    return data;
  },
  afterWrite: async (doc) => {
    if (doc.status === "in_progress" || doc.status === "scheduled") {
      await Vehicle.findByIdAndUpdate(doc.vehicle, { $set: { status: "maintenance" } });
    } else if (doc.status === "completed") {
      const v = await Vehicle.findById(doc.vehicle).select("currentAuthorization status");
      if (v && v.status === "maintenance") {
        await Vehicle.findByIdAndUpdate(doc.vehicle, { $set: { status: v.currentAuthorization ? "authorized" : "available" } });
      }
    }
  },
});
