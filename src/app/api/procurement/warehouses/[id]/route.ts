import { itemRoute } from "@/lib/crudFactory";
import { Warehouse } from "@/models/Warehouse";
import { CreateWarehouseSchema, UpdateWarehouseSchema } from "@/lib/validators";
import { warehouseSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: Warehouse,
  resource: "procurement.warehouses",
  listSpec: warehouseSpec,
  createSchema: CreateWarehouseSchema,
  updateSchema: UpdateWarehouseSchema,
  label: (d) => String(d.name ?? ""),
  beforeWrite: (data) => {
    for (const k of Object.keys(data)) if (data[k] === "") data[k] = null;
    return data;
  },
});
