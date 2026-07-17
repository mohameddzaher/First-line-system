import { collectionRoute } from "@/lib/crudFactory";
import { Custody } from "@/models/Custody";
import { CreateCustodySchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { ICustody } from "@/models/Custody";

export const runtime = "nodejs";

export const custodySpec: ListSpec<ICustody> = {
  searchFields: ["name", "serial", "brand"],
  filterMap: {
    type: (v) => ({ type: v }),
    status: (v) => ({ status: v }),
  },
  sortable: ["name", "type", "status", "assignedDate", "createdAt"],
  defaultSort: "createdAt",
  populate: [{ path: "employee", select: "nameAr employeeNumber idNumber" }],
};

/**
 * Keeps the custody lifecycle coherent: assigning to an employee flips status to
 * "assigned" and records the handover; clearing the employee returns it to stock.
 * Every transition appends to the item's history so its profile shows the trail.
 */
function applyCustodyLogic(
  data: Record<string, unknown>,
  ctx: { userId: string; existing?: Record<string, unknown> },
): Record<string, unknown> {
  const out = { ...data };
  if (out.employee === "") out.employee = null;
  if (out.warehouse === "") out.warehouse = null;

  const prevEmployee = ctx.existing?.employee ? String(ctx.existing.employee) : null;
  const nextEmployee = out.employee ? String(out.employee) : null;

  if (nextEmployee && nextEmployee !== prevEmployee) {
    out.status = "assigned";
    if (!out.assignedDate) out.assignedDate = new Date();
    out.$push = {
      history: {
        action: prevEmployee ? "transferred" : "assigned",
        employee: out.employee,
        date: new Date(),
        by: ctx.userId,
      },
    };
  } else if (!nextEmployee && prevEmployee) {
    // Returned to warehouse.
    out.status = out.status && out.status !== "assigned" ? out.status : "in_stock";
    out.returnedDate = new Date();
    out.$push = {
      history: { action: "returned", employee: null, date: new Date(), by: ctx.userId },
    };
  }
  return out;
}

export const { GET, POST } = collectionRoute({
  model: Custody,
  resource: "hr.custody",
  listSpec: custodySpec,
  createSchema: CreateCustodySchema,
  updateSchema: CreateCustodySchema,
  label: (d) => `${d.name ?? ""}${d.serial ? ` · ${d.serial}` : ""}`,
  beforeWrite: (data, { user }) => {
    const result = applyCustodyLogic(data, { userId: user.id });
    // collectionRoute uses Model.create; translate $push into an initial array.
    if (result.$push) {
      result.history = [(result.$push as { history: unknown }).history];
      delete result.$push;
    }
    return result;
  },
});
