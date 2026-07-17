import { collectionRoute } from "@/lib/crudFactory";
import { Warehouse } from "@/models/Warehouse";
import { CreateWarehouseSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { IWarehouse } from "@/models/Warehouse";

export const runtime = "nodejs";

export const warehouseSpec: ListSpec<IWarehouse> = {
  searchFields: ["name", "location"],
  filterMap: {
    isActive: (v) => ({ isActive: v === "true" }),
  },
  sortable: ["name", "createdAt"],
  defaultSort: "name",
  populate: [{ path: "manager", select: "nameAr" }],
};

export const { GET, POST } = collectionRoute({
  model: Warehouse,
  resource: "procurement.warehouses",
  listSpec: warehouseSpec,
  createSchema: CreateWarehouseSchema,
  updateSchema: CreateWarehouseSchema,
  label: (d) => String(d.name ?? ""),
  beforeWrite: (data) => {
    for (const k of Object.keys(data)) if (data[k] === "") data[k] = null;
    return data;
  },
});
