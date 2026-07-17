import { Schema, model, models, type Model, type Types } from "mongoose";

/**
 * A third-party account First Line delivers for (Keeta, HungerStation, Amazon, ...).
 * Operations attaches driver accounts and shipment volumes to these.
 */
export interface IProject {
  _id: Types.ObjectId;
  nameAr: string;
  nameEn?: string;
  code?: string;
  /** CRM company this project bills to, if any. */
  client?: Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    nameAr: { type: String, required: true, trim: true, unique: true },
    nameEn: { type: String, trim: true },
    code: { type: String, trim: true },
    client: { type: Schema.Types.ObjectId, ref: "Company", default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Project: Model<IProject> =
  (models.Project as Model<IProject>) || model<IProject>("Project", ProjectSchema);

export default Project;
