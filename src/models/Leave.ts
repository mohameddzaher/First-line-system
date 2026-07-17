import { Schema, model, models, type Model, type Types } from "mongoose";

export const LEAVE_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export interface ILeave {
  _id: Types.ObjectId;
  employee: Types.ObjectId;
  leaveType: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  /** Whole days requested, computed on save from the date range. */
  days: number;
  reason?: string;
  status: LeaveStatus;
  /** Snapshot of the accrued balance at request time, for the audit trail. */
  balanceAtRequest?: number;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  reviewNote?: string;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema = new Schema<ILeave>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    leaveType: { type: Schema.Types.ObjectId, ref: "LeaveType", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true },
    status: { type: String, enum: LEAVE_STATUSES, default: "pending", index: true },
    balanceAtRequest: { type: Number },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

LeaveSchema.index({ employee: 1, status: 1 });
LeaveSchema.index({ startDate: 1, endDate: 1 });

export const Leave: Model<ILeave> =
  (models.Leave as Model<ILeave>) || model<ILeave>("Leave", LeaveSchema);

export default Leave;
