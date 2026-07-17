import { guard, ok, readBody } from "@/lib/api";
import { Vehicle } from "@/models/Vehicle";
import { Employee } from "@/models/Employee";
import { Custody } from "@/models/Custody";
import { AuthorizeVehicleSchema } from "@/lib/validators";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * Authorize (or transfer) a vehicle to an employee. This is the fleet <-> HR link:
 *  1. closes any open authorization (records its end date),
 *  2. opens a new authorization and sets currentAuthorization,
 *  3. creates a matching Custody item for the employee (or moves the existing one),
 *     so the vehicle shows up in the employee's HR profile as custody.
 */
export const POST = guard({ permission: "fleet.authorizations:create" }, async ({ request, params, user }) => {
  const body = await readBody(request, AuthorizeVehicleSchema);

  const vehicle = await Vehicle.findById(params.id);
  if (!vehicle) return ok({ error: "NOT_FOUND" }, 404);

  const employee = await Employee.findById(body.employee).select("nameAr");
  if (!employee) return ok({ error: "EMPLOYEE_NOT_FOUND" }, 404);

  const now = body.startDate ?? new Date();
  const previousEmployee = vehicle.currentAuthorization?.employee
    ? String(vehicle.currentAuthorization.employee)
    : null;
  const isTransfer = previousEmployee && previousEmployee !== String(body.employee);

  // 1. Close the currently open authorization, if any.
  const open = vehicle.authorizations.find((a) => !a.endDate);
  if (open) {
    open.endDate = now;
    // Return the old custody link to stock.
    if (open.custody) {
      await Custody.findByIdAndUpdate(open.custody, {
        $set: { status: "returned", employee: null, returnedDate: now },
        $push: { history: { action: "returned", employee: null, date: now, by: user.id } },
      });
    }
  }

  // 2. Create the custody record that ties this vehicle to the employee in HR.
  const custody = await Custody.create({
    name: `${vehicle.type === "motorcycle" ? "دراجة آلية" : vehicle.type === "heavy_truck" ? "شاحنة" : "سيارة"} ${vehicle.plateNumber}`,
    type: vehicle.type === "motorcycle" ? "motorcycle" : "vehicle",
    serial: vehicle.plateNumber,
    condition: "good",
    status: "assigned",
    employee: body.employee,
    assignedDate: now,
    vehicle: vehicle._id,
    history: [{ action: "assigned", employee: body.employee as never, date: now, by: user.id as never }],
    createdBy: user.id,
  });

  // 3. Open the new authorization and denormalise the current holder.
  vehicle.authorizations.push({
    employee: body.employee as never,
    startDate: now,
    endDate: null,
    authorizationType: body.authorizationType,
    custody: custody._id,
    note: body.note,
  });
  vehicle.currentAuthorization = {
    employee: body.employee as never,
    startDate: now,
    authorizationType: body.authorizationType,
  };
  vehicle.status = "authorized";
  await vehicle.save();

  await writeAudit({
    actor: user,
    action: isTransfer ? "transfer" : "assign",
    resource: "fleet.authorizations",
    resourceId: String(vehicle._id),
    resourceLabel: `${vehicle.plateNumber} → ${employee.nameAr}`,
    meta: { transfer: Boolean(isTransfer) },
  });

  return ok(vehicle.toObject());
});
