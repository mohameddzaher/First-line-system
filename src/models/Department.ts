import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IDepartment {
  _id: Types.ObjectId;
  nameAr: string;
  nameEn?: string;
  code?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    nameAr: { type: String, required: true, trim: true, unique: true },
    nameEn: { type: String, trim: true },
    code: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Department: Model<IDepartment> =
  (models.Department as Model<IDepartment>) || model<IDepartment>("Department", DepartmentSchema);

export default Department;
