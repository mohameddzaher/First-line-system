import { Schema, model, models, type Model, type Types } from "mongoose";

/**
 * Stock held in a warehouse. When HR hands an item out as custody, the linked
 * inventory item's quantity is decremented (and incremented on return), so stock
 * levels always reflect what's actually on the shelf.
 */
export interface IInventoryItem {
  _id: Types.ObjectId;
  name: string;
  sku?: string;
  category?: string;
  warehouse: Types.ObjectId;
  quantity: number;
  reorderLevel: number;
  unitCost?: number;
  /** Maps to a Custody type, so issuing custody knows which stock to draw down. */
  custodyType?: string;
  notes?: string;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    name: { type: String, required: true, trim: true, index: true },
    sku: { type: String, trim: true, index: true },
    category: { type: String, trim: true, index: true },
    warehouse: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    quantity: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 0, min: 0 },
    unitCost: { type: Number, min: 0 },
    custodyType: { type: String, trim: true },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

InventoryItemSchema.index({ name: "text", sku: "text", category: "text" });

export const InventoryItem: Model<IInventoryItem> =
  (models.InventoryItem as Model<IInventoryItem>) ||
  model<IInventoryItem>("InventoryItem", InventoryItemSchema);

export default InventoryItem;
