import { collectionRoute } from "@/lib/crudFactory";
import { Maintenance } from "@/models/Maintenance";
import { Vehicle } from "@/models/Vehicle";
import { CreateMaintenanceSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { IMaintenance } from "@/models/Maintenance";

export const runtime = "nodejs";

export const maintenanceSpec: ListSpec<IMaintenance> = {
  searchFields: ["workshop", "description"],
  refSearch: [{ localField: "vehicle", model: () => Vehicle, fields: ["plateNumber", "plateLatin"] }],
  filterMap: {
    type: (v) => ({ type: v }),
    status: (v) => ({ status: v }),
    vehicle: (v) => ({ vehicle: v }),
  },
  sortable: ["date", "type", "status", "cost", "createdAt"],
  defaultSort: "date",
  populate: [{ path: "vehicle", select: "plateNumber plateLatin type city" }],
};

/** Setting a maintenance record to in_progress flips the vehicle into maintenance;
 *  completing it returns the vehicle to available (unless it holds an authorization). */
export const { GET, POST } = collectionRoute({
  model: Maintenance,
  resource: "fleet.maintenance",
  listSpec: maintenanceSpec,
  createSchema: CreateMaintenanceSchema,
  updateSchema: CreateMaintenanceSchema,
  label: (d) => `maintenance ${d.type ?? ""}`,
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
