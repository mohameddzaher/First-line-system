import { Schema, model, models, type Model, type Types } from "mongoose";

/** A partner/client logo shown on the marketing site. */
export interface IClientLogo {
  _id: Types.ObjectId;
  name: string;
  /** Logo as a URL or data URI so it renders without external hosting. */
  logo: string;
  website?: string;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClientLogoSchema = new Schema<IClientLogo>(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String, required: true },
    website: { type: String, trim: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const ClientLogo: Model<IClientLogo> =
  (models.ClientLogo as Model<IClientLogo>) || model<IClientLogo>("ClientLogo", ClientLogoSchema);

export default ClientLogo;
