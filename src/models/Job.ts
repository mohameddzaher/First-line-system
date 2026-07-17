import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IJob {
  _id: Types.ObjectId;
  title_ar: string;
  title_en: string;
  department?: string;
  location_ar?: string;
  location_en?: string;
  type: "full_time" | "part_time" | "contract" | "freelance";
  description_ar: string;
  description_en: string;
  published: boolean;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    title_ar: { type: String, required: true, trim: true },
    title_en: { type: String, required: true, trim: true },
    department: { type: String, trim: true },
    location_ar: { type: String, trim: true },
    location_en: { type: String, trim: true },
    type: { type: String, enum: ["full_time", "part_time", "contract", "freelance"], default: "full_time" },
    description_ar: { type: String, default: "" },
    description_en: { type: String, default: "" },
    published: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

export const Job: Model<IJob> = (models.Job as Model<IJob>) || model<IJob>("Job", JobSchema);

export default Job;
