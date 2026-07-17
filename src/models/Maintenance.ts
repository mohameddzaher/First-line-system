import { Schema, model, models, type Model, type Types } from "mongoose";

export const MAINTENANCE_TYPES = ["periodic", "repair", "tires", "oil", "accident_repair", "inspection", "other"] as const;
export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];

export const MAINTENANCE_STATUSES = ["scheduled", "in_progress", "completed", "cancelled"] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

/** A maintenance / service record against a vehicle. */
export interface IMaintenance {
  _id: Types.ObjectId;
  vehicle: Types.ObjectId;
  type: MaintenanceType;
  status: MaintenanceStatus;
  date: Date;
  completedDate?: Date | null;
  odometer?: number;
  workshop?: string;
  description?: string;
  cost?: number;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceSchema = new Schema<IMaintenance>(
  {
    vehicle: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
    type: { type: String, enum: MAINTENANCE_TYPES, default: "periodic", index: true },
    status: { type: String, enum: MAINTENANCE_STATUSES, default: "scheduled", index: true },
    date: { type: Date, required: true, index: true },
    completedDate: { type: Date, default: null },
    odometer: { type: Number, min: 0 },
    workshop: { type: String, trim: true },
    description: { type: String, trim: true },
    cost: { type: Number, min: 0, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

export const Maintenance: Model<IMaintenance> =
  (models.Maintenance as Model<IMaintenance>) || model<IMaintenance>("Maintenance", MaintenanceSchema);

export default Maintenance;
