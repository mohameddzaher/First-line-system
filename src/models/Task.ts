import { Schema, model, models, type Model, type Types } from "mongoose";

export const TASK_STATUSES = ["todo", "in_progress", "done", "cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** Shared by HR "My Tasks" and Complaints — `kind` discriminates them. */
export interface ITask {
  _id: Types.ObjectId;
  kind: "task" | "complaint";
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | null;
  assignedTo?: Types.ObjectId | null;
  relatedEmployee?: Types.ObjectId | null;
  createdBy?: Types.ObjectId | null;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    kind: { type: String, enum: ["task", "complaint"], default: "task", index: true },
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },
    status: { type: String, enum: TASK_STATUSES, default: "todo", index: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: "medium" },
    dueDate: { type: Date, default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    relatedEmployee: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Task: Model<ITask> =
  (models.Task as Model<ITask>) || model<ITask>("Task", TaskSchema);

export default Task;
