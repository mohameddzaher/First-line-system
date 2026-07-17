import { Schema, model, models, type Model, type Types } from "mongoose";
import { ROLE_KEYS, type RoleKey } from "@/lib/rbac";

export interface IUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: RoleKey;
  /** Extra permissions granted on top of the role, or explicit denials. */
  extraPermissions: string[];
  deniedPermissions: string[];
  /** The HR employee record this login belongs to. Drives all self-service pages. */
  employee?: Types.ObjectId | null;
  directManager?: Types.ObjectId | null;
  /** CRM companies this user is responsible for (sales/CRM scoping). */
  assignedCustomers: Types.ObjectId[];
  isActive: boolean;
  lastLoginAt?: Date | null;
  /** Bumped on password change / forced logout to invalidate live sessions. */
  sessionVersion: number;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ROLE_KEYS, default: "employee", index: true },
    extraPermissions: { type: [String], default: [] },
    deniedPermissions: { type: [String], default: [] },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", default: null, index: true },
    directManager: { type: Schema.Types.ObjectId, ref: "User", default: null },
    assignedCustomers: [{ type: Schema.Types.ObjectId, ref: "Company" }],
    isActive: { type: Boolean, default: true, index: true },
    lastLoginAt: { type: Date, default: null },
    sessionVersion: { type: Number, default: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

UserSchema.virtual("fullName").get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`.trim();
});

UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

export const User: Model<IUser> =
  (models.User as Model<IUser>) || model<IUser>("User", UserSchema);

export default User;
