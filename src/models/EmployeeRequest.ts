import { Schema, model, models, type Model, type Types } from "mongoose";

export const REQUEST_CATEGORIES = [
  "salary_certificate",
  "salary_definition",
  "experience_certificate",
  "leave_balance",
  "advance",
  "loan",
  "transfer",
  "resignation",
  "complaint",
  "other",
] as const;
export type RequestCategory = (typeof REQUEST_CATEGORIES)[number];

export const REQUEST_STATUSES = ["open", "in_progress", "resolved", "rejected", "closed"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export interface IRequestComment {
  author: Types.ObjectId;
  authorName: string;
  body: string;
  date: Date;
}

export interface IEmployeeRequest {
  _id: Types.ObjectId;
  employee: Types.ObjectId;
  category: RequestCategory;
  subject: string;
  body?: string;
  status: RequestStatus;
  assignedTo?: Types.ObjectId | null;
  comments: IRequestComment[];
  resolvedAt?: Date | null;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const RequestCommentSchema = new Schema<IRequestComment>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, default: "" },
    body: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now },
  },
  { _id: false },
);

const EmployeeRequestSchema = new Schema<IEmployeeRequest>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    category: { type: String, enum: REQUEST_CATEGORIES, default: "other", index: true },
    subject: { type: String, required: true, trim: true },
    body: { type: String, trim: true },
    status: { type: String, enum: REQUEST_STATUSES, default: "open", index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    comments: { type: [RequestCommentSchema], default: [] },
    resolvedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

export const EmployeeRequest: Model<IEmployeeRequest> =
  (models.EmployeeRequest as Model<IEmployeeRequest>) ||
  model<IEmployeeRequest>("EmployeeRequest", EmployeeRequestSchema);

export default EmployeeRequest;
