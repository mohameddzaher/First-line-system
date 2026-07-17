import { guard, ok } from "@/lib/api";
import { Vehicle } from "@/models/Vehicle";
import { Custody } from "@/models/Custody";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

/** Ends the current authorization and returns the linked custody to the warehouse. */
export const POST = guard({ permission: "fleet.authorizations:update" }, async ({ params, user }) => {
  const vehicle = await Vehicle.findById(params.id);
  if (!vehicle) return ok({ error: "NOT_FOUND" }, 404);
  if (!vehicle.currentAuthorization) return ok({ error: "NOT_AUTHORIZED" }, 400);

  const now = new Date();
  const open = vehicle.authorizations.find((a) => !a.endDate);
  if (open) {
    open.endDate = now;
    if (open.custody) {
      await Custody.findByIdAndUpdate(open.custody, {
        $set: { status: "returned", employee: null, returnedDate: now },
        $push: { history: { action: "returned", employee: null, date: now, by: user.id } },
      });
    }
  }

  vehicle.currentAuthorization = null;
  vehicle.status = "available";
  await vehicle.save();

  await writeAudit({
    actor: user,
    action: "revoke",
    resource: "fleet.authorizations",
    resourceId: String(vehicle._id),
    resourceLabel: vehicle.plateNumber,
  });

  return ok(vehicle.toObject());
});
