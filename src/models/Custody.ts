import { Schema, model, models, type Model, type Types } from "mongoose";

export const CUSTODY_TYPES = [
  "laptop",
  "phone",
  "vehicle",
  "motorcycle",
  "sim_card",
  "uniform",
  "tools",
  "access_card",
  "other",
] as const;
export type CustodyType = (typeof CUSTODY_TYPES)[number];

export const CUSTODY_STATUSES = ["assigned", "returned", "lost", "damaged", "in_stock"] as const;
export type CustodyStatus = (typeof CUSTODY_STATUSES)[number];

export const CUSTODY_CONDITIONS = ["new", "good", "fair", "poor"] as const;
export type CustodyCondition = (typeof CUSTODY_CONDITIONS)[number];

/** One handover event in a custody item's life (assigned to X, returned, transferred). */
export interface ICustodyHistory {
  action: "assigned" | "returned" | "transferred" | "reported_lost" | "reported_damaged" | "stocked";
  employee?: Types.ObjectId | null;
  date: Date;
  by?: Types.ObjectId | null;
  note?: string;
}

export interface ICustody {
  _id: Types.ObjectId;
  name: string;
  type: CustodyType;
  brand?: string;
  serial?: string;
  condition: CustodyCondition;
  status: CustodyStatus;
  /** Null when the item is sitting in the warehouse rather than held by anyone. */
  employee?: Types.ObjectId | null;
  assignedDate?: Date | null;
  returnedDate?: Date | null;
  /** Links this custody to a fleet vehicle when the item IS a vehicle. */
  vehicle?: Types.ObjectId | null;
  /** Warehouse the item belongs to when in stock. */
  warehouse?: Types.ObjectId | null;
  estimatedValue?: number;
  history: ICustodyHistory[];
  notes?: string;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CustodyHistorySchema = new Schema<ICustodyHistory>(
  {
    action: {
      type: String,
      enum: ["assigned", "returned", "transferred", "reported_lost", "reported_damaged", "stocked"],
      required: true,
    },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    date: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String, trim: true },
  },
  { _id: false },
);

const CustodySchema = new Schema<ICustody>(
  {
    name: { type: String, required: true, trim: true, index: true },
    type: { type: String, enum: CUSTODY_TYPES, default: "other", index: true },
    brand: { type: String, trim: true },
    serial: { type: String, trim: true, index: true },
    condition: { type: String, enum: CUSTODY_CONDITIONS, default: "good" },
    status: { type: String, enum: CUSTODY_STATUSES, default: "in_stock", index: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", default: null, index: true },
    assignedDate: { type: Date, default: null },
    returnedDate: { type: Date, default: null },
    vehicle: { type: Schema.Types.ObjectId, ref: "Vehicle", default: null },
    warehouse: { type: Schema.Types.ObjectId, ref: "Warehouse", default: null },
    estimatedValue: { type: Number, min: 0 },
    history: { type: [CustodyHistorySchema], default: [] },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

CustodySchema.index({ name: "text", serial: "text", brand: "text" });

export const Custody: Model<ICustody> =
  (models.Custody as Model<ICustody>) || model<ICustody>("Custody", CustodySchema);

export default Custody;
