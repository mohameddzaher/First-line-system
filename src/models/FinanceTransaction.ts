import { Schema, model, models, type Model, type Types } from "mongoose";

export const TXN_KINDS = ["revenue", "expense"] as const;
export type TxnKind = (typeof TXN_KINDS)[number];

export const TXN_STATUSES = ["draft", "posted", "reconciled", "void"] as const;
export type TxnStatus = (typeof TXN_STATUSES)[number];

/** A finance ledger entry — revenue or expense — optionally tied to a project/company. */
export interface IFinanceTransaction {
  _id: Types.ObjectId;
  reference: string;
  kind: TxnKind;
  category: string;
  amount: number;
  date: Date;
  status: TxnStatus;
  project?: Types.ObjectId | null;
  company?: Types.ObjectId | null;
  method?: string;
  description?: string;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const FinanceTransactionSchema = new Schema<IFinanceTransaction>(
  {
    reference: { type: String, required: true, trim: true, unique: true, index: true },
    kind: { type: String, enum: TXN_KINDS, required: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now, index: true },
    status: { type: String, enum: TXN_STATUSES, default: "posted", index: true },
    project: { type: Schema.Types.ObjectId, ref: "Project", default: null },
    company: { type: Schema.Types.ObjectId, ref: "Company", default: null },
    method: { type: String, trim: true },
    description: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

FinanceTransactionSchema.index({ reference: "text", category: "text", description: "text" });
FinanceTransactionSchema.index({ kind: 1, date: -1 });

export const FinanceTransaction: Model<IFinanceTransaction> =
  (models.FinanceTransaction as Model<IFinanceTransaction>) ||
  model<IFinanceTransaction>("FinanceTransaction", FinanceTransactionSchema);

export default FinanceTransaction;
