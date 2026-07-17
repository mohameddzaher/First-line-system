import { Schema, model, models, type Model, type Types } from "mongoose";

export const DEAL_STAGES = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

export interface IDeal {
  _id: Types.ObjectId;
  title: string;
  company?: Types.ObjectId | null;
  contact?: Types.ObjectId | null;
  owner?: Types.ObjectId | null;
  stage: DealStage;
  value: number;
  /** Win probability 0–100; pipeline value weighting uses it. */
  probability: number;
  expectedCloseDate?: Date | null;
  closedDate?: Date | null;
  notes?: string;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const DealSchema = new Schema<IDeal>(
  {
    title: { type: String, required: true, trim: true, index: true },
    company: { type: Schema.Types.ObjectId, ref: "Company", default: null, index: true },
    contact: { type: Schema.Types.ObjectId, ref: "Contact", default: null },
    owner: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    stage: { type: String, enum: DEAL_STAGES, default: "lead", index: true },
    value: { type: Number, default: 0, min: 0 },
    probability: { type: Number, default: 10, min: 0, max: 100 },
    expectedCloseDate: { type: Date, default: null },
    closedDate: { type: Date, default: null },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

DealSchema.index({ title: "text" });

export const Deal: Model<IDeal> = (models.Deal as Model<IDeal>) || model<IDeal>("Deal", DealSchema);

export default Deal;
