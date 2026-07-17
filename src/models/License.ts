import { Schema, model, models, type Model, type Types } from "mongoose";

/**
 * Company-level licenses and subscriptions (municipality registers, transport
 * permits, insurance policies). Distinct from an employee's personal documents.
 */
export interface ILicense {
  _id: Types.ObjectId;
  name: string;
  category: string;
  durationLabel?: string;
  issueDate?: Date | null;
  expiryDate: Date;
  location?: string;
  number?: string;
  fileUrl?: string | null;
  notes?: string;
  isActive: boolean;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const LicenseSchema = new Schema<ILicense>(
  {
    name: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    durationLabel: { type: String, trim: true },
    issueDate: { type: Date, default: null },
    expiryDate: { type: Date, required: true, index: true },
    location: { type: String, trim: true, index: true },
    number: { type: String, trim: true },
    fileUrl: { type: String, default: null },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

LicenseSchema.index({ name: "text", category: "text", location: "text" });

export const License: Model<ILicense> =
  (models.License as Model<ILicense>) || model<ILicense>("License", LicenseSchema);

export default License;
