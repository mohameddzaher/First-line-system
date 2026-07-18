import { collectionRoute } from "@/lib/crudFactory";
import { Order } from "@/models/Order";
import { CreateOrderSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { IOrder } from "@/models/Order";

export const runtime = "nodejs";

export const orderSpec: ListSpec<IOrder> = {
  searchFields: ["orderNumber", "customerName", "customerPhone", "externalId", "city"],
  filterMap: {
    status: (v) => ({ status: v }),
    project: (v) => ({ project: v }),
    driver: (v) => ({ driver: v }),
    city: (v) => ({ city: v }),
    sla: (v) => (v === "breached" ? { slaBreached: true } : {}),
  },
  sortable: ["orderNumber", "status", "placedAt", "amount", "createdAt"],
  defaultSort: "placedAt",
  populate: [
    { path: "project", select: "nameAr nameEn" },
    { path: "driver", select: "nameAr employeeNumber" },
  ],
};

export const { GET, POST } = collectionRoute({
  model: Order,
  resource: "ops.orders",
  listSpec: orderSpec,
  createSchema: CreateOrderSchema,
  updateSchema: CreateOrderSchema,
  label: (d) => String(d.orderNumber ?? ""),
  beforeWrite: (data) => {
    if (data.driver === "") data.driver = null;
    if (data.project === "") data.project = null;
    // Seed the timeline with the initial status.
    data.timeline = [{ status: data.status ?? "new", at: new Date() }];
    if (data.driver && (data.status === "new" || !data.status)) data.status = "assigned";
    return data;
  },
});
