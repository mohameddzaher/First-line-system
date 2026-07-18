import { Schema, model, models, type Model, type Types } from "mongoose";

export interface INotification {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  body?: string;
  /** Where the bell click should take the user. */
  href?: string;
  type: "info" | "success" | "warning" | "danger";
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, trim: true },
    href: { type: String, trim: true },
    type: { type: String, enum: ["info", "success", "warning", "danger"], default: "info" },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  (models.Notification as Model<INotification>) || model<INotification>("Notification", NotificationSchema);

export default Notification;
