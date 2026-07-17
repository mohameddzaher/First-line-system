import { Schema, model, models, type Model, type Types } from "mongoose";

export const CONTRACT_TYPES = ["fixed", "unlimited", "part_time", "temporary"] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

export const CONTRACT_STATUSES = ["active", "expired", "terminated", "draft"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export interface IContract {
  _id: Types.ObjectId;
  employee: Types.ObjectId;
  type: ContractType;
  startDate: Date;
  endDate?: Date | null;
  /** Annual leave days granted per year — drives the accrual balance. */
  annualLeaveDays: number;
  basicSalary?: number;
  housingAllowance?: number;
  transportAllowance?: number;
  otherAllowance?: number;
  status: ContractStatus;
  /** Set true when service is ended; blocks re-termination. */
  terminatedAt?: Date | null;
  terminationReason?: string;
  fileUrl?: string | null;
  notes?: string;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ContractSchema = new Schema<IContract>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    type: { type: String, enum: CONTRACT_TYPES, default: "fixed" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    annualLeaveDays: { type: Number, default: 30, min: 0 },
    basicSalary: { type: Number, min: 0 },
    housingAllowance: { type: Number, min: 0 },
    transportAllowance: { type: Number, min: 0 },
    otherAllowance: { type: Number, min: 0 },
    status: { type: String, enum: CONTRACT_STATUSES, default: "active", index: true },
    terminatedAt: { type: Date, default: null },
    terminationReason: { type: String, trim: true },
    fileUrl: { type: String, default: null },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

ContractSchema.index({ endDate: 1, status: 1 });

export const Contract: Model<IContract> =
  (models.Contract as Model<IContract>) || model<IContract>("Contract", ContractSchema);

export default Contract;
