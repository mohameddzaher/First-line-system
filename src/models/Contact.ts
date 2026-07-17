import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IContact {
  _id: Types.ObjectId;
  name: string;
  company?: Types.ObjectId | null;
  title?: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    name: { type: String, required: true, trim: true, index: true },
    company: { type: Schema.Types.ObjectId, ref: "Company", default: null, index: true },
    title: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

ContactSchema.index({ name: "text", email: "text", phone: "text" });

export const Contact: Model<IContact> =
  (models.Contact as Model<IContact>) || model<IContact>("Contact", ContactSchema);

export default Contact;
