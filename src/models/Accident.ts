import { Schema, model, models, type Model, type Types } from "mongoose";

export const ACCIDENT_SEVERITIES = ["minor", "moderate", "major", "total_loss"] as const;
export type AccidentSeverity = (typeof ACCIDENT_SEVERITIES)[number];

export const ACCIDENT_STATUSES = ["open", "under_review", "closed"] as const;
export type AccidentStatus = (typeof ACCIDENT_STATUSES)[number];

export const FAULT = ["driver", "third_party", "shared", "undetermined"] as const;
export type Fault = (typeof FAULT)[number];

export interface IAccident {
  _id: Types.ObjectId;
  vehicle: Types.ObjectId;
  employee?: Types.ObjectId | null;
  date: Date;
  description?: string;
  severity: AccidentSeverity;
  atFault: Fault;
  status: AccidentStatus;
  estimatedCost?: number;
  actualCost?: number;
  location?: string;
  reportNumber?: string;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const AccidentSchema = new Schema<IAccident>(
  {
    vehicle: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    date: { type: Date, required: true, index: true },
    description: { type: String, trim: true },
    severity: { type: String, enum: ACCIDENT_SEVERITIES, default: "minor", index: true },
    atFault: { type: String, enum: FAULT, default: "undetermined", index: true },
    status: { type: String, enum: ACCIDENT_STATUSES, default: "open", index: true },
    estimatedCost: { type: Number, min: 0, default: 0 },
    actualCost: { type: Number, min: 0, default: 0 },
    location: { type: String, trim: true },
    reportNumber: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

export const Accident: Model<IAccident> =
  (models.Accident as Model<IAccident>) || model<IAccident>("Accident", AccidentSchema);

export default Accident;
