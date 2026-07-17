import { Schema, model, models, type Model, type Types } from "mongoose";

export const SUBMISSION_TYPES = ["contact", "newsletter", "job_application"] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];

export const SUBMISSION_STATUSES = ["new", "read", "replied", "archived"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

/** A message captured from the public site (contact form, newsletter, job apply). */
export interface ISubmission {
  _id: Types.ObjectId;
  type: SubmissionType;
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  /** For job applications. */
  jobId?: Types.ObjectId | null;
  jobTitle?: string;
  status: SubmissionStatus;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    type: { type: String, enum: SUBMISSION_TYPES, required: true, index: true },
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true },
    subject: { type: String, trim: true },
    message: { type: String, trim: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", default: null },
    jobTitle: { type: String, trim: true },
    status: { type: String, enum: SUBMISSION_STATUSES, default: "new", index: true },
    ip: { type: String },
  },
  { timestamps: true },
);

SubmissionSchema.index({ name: "text", email: "text", subject: "text", message: "text" });

export const Submission: Model<ISubmission> =
  (models.Submission as Model<ISubmission>) || model<ISubmission>("Submission", SubmissionSchema);

export default Submission;
