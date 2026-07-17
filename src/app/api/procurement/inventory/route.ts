import { collectionRoute } from "@/lib/crudFactory";
import { InventoryItem } from "@/models/InventoryItem";
import { CreateInventorySchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { IInventoryItem } from "@/models/InventoryItem";

export const runtime = "nodejs";

export const inventoryItemSpec: ListSpec<IInventoryItem> = {
  searchFields: ["name", "sku", "category"],
  filterMap: {
    warehouse: (v) => ({ warehouse: v }),
    category: (v) => ({ category: v }),
  },
  sortable: ["name", "quantity", "category", "createdAt"],
  defaultSort: "name",
  populate: [{ path: "warehouse", select: "name" }],
};

export const { GET, POST } = collectionRoute({
  model: InventoryItem,
  resource: "procurement.inventory",
  listSpec: inventoryItemSpec,
  createSchema: CreateInventorySchema,
  updateSchema: CreateInventorySchema,
  label: (d) => String(d.name ?? ""),
  beforeWrite: (data) => {
    for (const k of Object.keys(data)) if (data[k] === "") data[k] = null;
    return data;
  },
});
