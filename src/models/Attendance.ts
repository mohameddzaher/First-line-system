import { Schema, model, models, type Model, type Types } from "mongoose";

export const ATTENDANCE_STATUSES = ["present", "absent", "leave", "late", "holiday"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

/** One attendance record per employee per day. */
export interface IAttendance {
  _id: Types.ObjectId;
  employee: Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  hours?: number;
  notes?: string;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    date: { type: Date, required: true, index: true },
    status: { type: String, enum: ATTENDANCE_STATUSES, default: "present", index: true },
    checkIn: { type: String, trim: true },
    checkOut: { type: String, trim: true },
    hours: { type: Number, min: 0 },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

// One record per employee per day.
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export const Attendance: Model<IAttendance> =
  (models.Attendance as Model<IAttendance>) || model<IAttendance>("Attendance", AttendanceSchema);

export default Attendance;
