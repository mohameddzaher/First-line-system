import { Schema, model, models, type Model, type Types } from "mongoose";

/** A revenue goal for an owner over a period; attainment is measured against won deals. */
export interface ISalesTarget {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  period: string; // e.g. "2026-Q3" or "2026-07"
  targetAmount: number;
  notes?: string;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const SalesTargetSchema = new Schema<ISalesTarget>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    period: { type: String, required: true, trim: true, index: true },
    targetAmount: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

SalesTargetSchema.index({ owner: 1, period: 1 }, { unique: true });

export const SalesTarget: Model<ISalesTarget> =
  (models.SalesTarget as Model<ISalesTarget>) || model<ISalesTarget>("SalesTarget", SalesTargetSchema);

export default SalesTarget;
