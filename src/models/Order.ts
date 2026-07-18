import { Schema, model, models, type Model, type Types } from "mongoose";

export const ORDER_STATUSES = [
  "new",
  "assigned",
  "picked_up",
  "in_transit",
  "delivered",
  "failed",
  "returned",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface IOrderEvent {
  status: OrderStatus;
  at: Date;
  by?: Types.ObjectId | null;
  note?: string;
}

/**
 * A last-mile delivery order. `project` is the platform (Keeta/HungerStation/…);
 * `driver` is the rider. Status transitions append to `timeline`, and delivering
 * stamps SLA breach if it lands after `slaDueAt`.
 */
export interface IOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  /** Platform's own id, unique per platform — enables idempotent webhook ingestion. */
  externalId?: string;
  project?: Types.ObjectId | null;
  driver?: Types.ObjectId | null;
  status: OrderStatus;

  customerName?: string;
  customerPhone?: string;
  city?: string;
  pickupAddress?: string;
  dropoffAddress?: string;

  amount?: number;
  codAmount?: number;
  deliveryFee?: number;

  placedAt: Date;
  slaDueAt?: Date | null;
  deliveredAt?: Date | null;
  slaBreached: boolean;

  timeline: IOrderEvent[];
  notes?: string;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrderEventSchema = new Schema<IOrderEvent>(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String, trim: true },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, trim: true, unique: true, index: true },
    externalId: { type: String, trim: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
    driver: { type: Schema.Types.ObjectId, ref: "Employee", default: null, index: true },
    status: { type: String, enum: ORDER_STATUSES, default: "new", index: true },

    customerName: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    city: { type: String, trim: true, index: true },
    pickupAddress: { type: String, trim: true },
    dropoffAddress: { type: String, trim: true },

    amount: { type: Number, min: 0 },
    codAmount: { type: Number, min: 0 },
    deliveryFee: { type: Number, min: 0 },

    placedAt: { type: Date, default: Date.now, index: true },
    slaDueAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    slaBreached: { type: Boolean, default: false, index: true },

    timeline: { type: [OrderEventSchema], default: [] },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

OrderSchema.index({ orderNumber: "text", customerName: "text", customerPhone: "text" });
OrderSchema.index({ status: 1, placedAt: -1 });
OrderSchema.index({ project: 1, status: 1 });

export const Order: Model<IOrder> = (models.Order as Model<IOrder>) || model<IOrder>("Order", OrderSchema);

export default Order;
