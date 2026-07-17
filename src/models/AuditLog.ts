import { Schema, model, models, type Model, type Types } from "mongoose";

export const AUDIT_ACTIONS = [
  "create",
  "update",
  "delete",
  "login",
  "login_failed",
  "logout",
  "approve",
  "reject",
  "export",
  "transfer",
  "revoke",
  "assign",
  "return",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface IAuditChange {
  field: string;
  from: unknown;
  to: unknown;
}

export interface IAuditLog {
  _id: Types.ObjectId;
  actor?: Types.ObjectId | null;
  actorName: string;
  actorEmail: string;
  action: AuditAction;
  /** Dotted resource path, e.g. "hr.employees". */
  resource: string;
  resourceId?: string | null;
  /** Human label of the affected record, so the log stays readable after deletes. */
  resourceLabel?: string;
  changes: IAuditChange[];
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    actorName: { type: String, default: "System" },
    actorEmail: { type: String, default: "" },
    action: { type: String, enum: AUDIT_ACTIONS, required: true, index: true },
    resource: { type: String, required: true, index: true },
    resourceId: { type: String, default: null, index: true },
    resourceLabel: { type: String, default: "" },
    changes: {
      type: [
        new Schema<IAuditChange>(
          { field: String, from: Schema.Types.Mixed, to: Schema.Types.Mixed },
          { _id: false },
        ),
      ],
      default: [],
    },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// The audit page is always sorted newest-first and usually filtered by date.
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  (models.AuditLog as Model<IAuditLog>) || model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
