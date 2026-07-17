import { itemRoute } from "@/lib/crudFactory";
import { InventoryItem } from "@/models/InventoryItem";
import { CreateInventorySchema, UpdateInventorySchema } from "@/lib/validators";
import { inventoryItemSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: InventoryItem,
  resource: "procurement.inventory",
  listSpec: inventoryItemSpec,
  createSchema: CreateInventorySchema,
  updateSchema: UpdateInventorySchema,
  label: (d) => String(d.name ?? ""),
  beforeWrite: (data) => {
    for (const k of Object.keys(data)) if (data[k] === "") data[k] = null;
    return data;
  },
});
