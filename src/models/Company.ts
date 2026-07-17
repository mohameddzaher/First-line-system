import { Schema, model, models, type Model, type Types } from "mongoose";

/** A CRM company. `kind` lets the same record serve as customer, vendor, or both. */
export const COMPANY_KINDS = ["customer", "vendor", "both"] as const;
export type CompanyKind = (typeof COMPANY_KINDS)[number];

export const COMPANY_STATUSES = ["active", "prospect", "inactive"] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

export interface ICompany {
  _id: Types.ObjectId;
  name: string;
  nameAr?: string;
  kind: CompanyKind;
  status: CompanyStatus;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  city?: string;
  crNumber?: string;
  vatNumber?: string;
  /** Account owner (sales/CRM rep). */
  owner?: Types.ObjectId | null;
  notes?: string;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true, index: true },
    nameAr: { type: String, trim: true },
    kind: { type: String, enum: COMPANY_KINDS, default: "customer", index: true },
    status: { type: String, enum: COMPANY_STATUSES, default: "prospect", index: true },
    industry: { type: String, trim: true },
    website: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    city: { type: String, trim: true, index: true },
    crNumber: { type: String, trim: true },
    vatNumber: { type: String, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

CompanySchema.index({ name: "text", nameAr: "text", email: "text", crNumber: "text" });

export const Company: Model<ICompany> =
  (models.Company as Model<ICompany>) || model<ICompany>("Company", CompanySchema);

export default Company;
