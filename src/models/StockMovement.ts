import { Schema, model, models, type Model, type Types } from "mongoose";

export const MOVEMENT_TYPES = ["in", "out", "adjustment", "transfer"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

/**
 * An immutable stock movement (in/out/adjustment/transfer) against an inventory
 * item. Every movement applies its delta to the item's quantity at write time, so
 * the ledger and the on-hand quantity never drift.
 */
export interface IStockMovement {
  _id: Types.ObjectId;
  item: Types.ObjectId;
  type: MovementType;
  quantity: number;
  /** Signed quantity actually applied to stock (+in, −out). */
  delta: number;
  balanceAfter: number;
  reason?: string;
  reference?: string;
  employee?: Types.ObjectId | null;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    item: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true, index: true },
    type: { type: String, enum: MOVEMENT_TYPES, required: true, index: true },
    quantity: { type: Number, required: true, min: 0 },
    delta: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reason: { type: String, trim: true },
    reference: { type: String, trim: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

StockMovementSchema.index({ item: 1, createdAt: -1 });

export const StockMovement: Model<IStockMovement> =
  (models.StockMovement as Model<IStockMovement>) || model<IStockMovement>("StockMovement", StockMovementSchema);

export default StockMovement;
