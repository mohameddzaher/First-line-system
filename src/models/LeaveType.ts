import { Schema, model, models, type Model, type Types } from "mongoose";

export interface ILeaveType {
  _id: Types.ObjectId;
  nameAr: string;
  nameEn: string;
  code: string;
  paid: boolean;
  /** Whether taking this leave draws down the annual entitlement balance. */
  affectsBalance: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveTypeSchema = new Schema<ILeaveType>(
  {
    nameAr: { type: String, required: true, trim: true },
    nameEn: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, lowercase: true, unique: true },
    paid: { type: Boolean, default: true },
    affectsBalance: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const LeaveType: Model<ILeaveType> =
  (models.LeaveType as Model<ILeaveType>) || model<ILeaveType>("LeaveType", LeaveTypeSchema);

export default LeaveType;
