import { Schema, model, models, type Model, type Types } from "mongoose";

export const ACCOUNT_STATUSES = ["active", "idle", "suspended", "closed"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const SHIFTS = ["full", "morning", "evening", "night"] as const;
export type Shift = (typeof SHIFTS)[number];

/**
 * A rider currently working a third-party account. An account can carry more than
 * one rider on different shifts (e.g. a morning rider and a night rider), so this
 * is an array on the account rather than a single field.
 */
export interface IAssignment {
  _id?: Types.ObjectId;
  employee: Types.ObjectId;
  shift: Shift;
  startDate: Date;
  endDate?: Date | null;
  active: boolean;
}

/** One event in the account's assignment history (assigned / transferred / removed). */
export interface IAccountEvent {
  action: "assigned" | "transferred_in" | "transferred_out" | "removed";
  employee?: Types.ObjectId | null;
  shift?: Shift;
  date: Date;
  by?: Types.ObjectId | null;
  note?: string;
}

/**
 * A user account handed to us by a delivery platform (Keeta, HungerStation, ...).
 * Keeta gives us ~500 accounts; each is assigned to a rider who logs into it.
 */
export interface IThirdPartyAccount {
  _id: Types.ObjectId;
  project: Types.ObjectId;
  username: string;
  externalId?: string;
  phone?: string;
  status: AccountStatus;
  assignments: IAssignment[];
  history: IAccountEvent[];
  notes?: string;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    shift: { type: String, enum: SHIFTS, default: "full" },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  { _id: true },
);

const EventSchema = new Schema<IAccountEvent>(
  {
    action: {
      type: String,
      enum: ["assigned", "transferred_in", "transferred_out", "removed"],
      required: true,
    },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    shift: { type: String, enum: SHIFTS },
    date: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String, trim: true },
  },
  { _id: false },
);

const ThirdPartyAccountSchema = new Schema<IThirdPartyAccount>(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    username: { type: String, required: true, trim: true, index: true },
    externalId: { type: String, trim: true },
    phone: { type: String, trim: true },
    status: { type: String, enum: ACCOUNT_STATUSES, default: "idle", index: true },
    assignments: { type: [AssignmentSchema], default: [] },
    history: { type: [EventSchema], default: [] },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

ThirdPartyAccountSchema.index({ username: "text", externalId: "text" });
ThirdPartyAccountSchema.index({ project: 1, username: 1 }, { unique: true });
ThirdPartyAccountSchema.index({ "assignments.employee": 1, "assignments.active": 1 });

export const ThirdPartyAccount: Model<IThirdPartyAccount> =
  (models.ThirdPartyAccount as Model<IThirdPartyAccount>) ||
  model<IThirdPartyAccount>("ThirdPartyAccount", ThirdPartyAccountSchema);

export default ThirdPartyAccount;
