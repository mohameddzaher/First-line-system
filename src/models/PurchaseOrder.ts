import { Schema, model, models, type Model, type Types } from "mongoose";

export const PO_STATUSES = ["draft", "pending", "approved", "received", "cancelled"] as const;
export type POStatus = (typeof PO_STATUSES)[number];

export interface IPOLine {
  description: string;
  quantity: number;
  unitPrice: number;
  /** Inventory item to increment when the PO is received. */
  inventoryItem?: Types.ObjectId | null;
}

export interface IPurchaseOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  supplier: Types.ObjectId;
  warehouse?: Types.ObjectId | null;
  status: POStatus;
  orderDate: Date;
  expectedDate?: Date | null;
  receivedDate?: Date | null;
  lines: IPOLine[];
  subtotal: number;
  vat: number;
  total: number;
  notes?: string;
  approvedBy?: Types.ObjectId | null;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const POLineSchema = new Schema<IPOLine>(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    inventoryItem: { type: Schema.Types.ObjectId, ref: "InventoryItem", default: null },
  },
  { _id: false },
);

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    orderNumber: { type: String, required: true, trim: true, unique: true, index: true },
    supplier: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    warehouse: { type: Schema.Types.ObjectId, ref: "Warehouse", default: null },
    status: { type: String, enum: PO_STATUSES, default: "draft", index: true },
    orderDate: { type: Date, default: Date.now, index: true },
    expectedDate: { type: Date, default: null },
    receivedDate: { type: Date, default: null },
    lines: { type: [POLineSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    vat: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    notes: { type: String, trim: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

export const PurchaseOrder: Model<IPurchaseOrder> =
  (models.PurchaseOrder as Model<IPurchaseOrder>) ||
  model<IPurchaseOrder>("PurchaseOrder", PurchaseOrderSchema);

export default PurchaseOrder;
