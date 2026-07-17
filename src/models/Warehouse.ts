import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IWarehouse {
  _id: Types.ObjectId;
  name: string;
  location?: string;
  manager?: Types.ObjectId | null;
  isActive: boolean;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseSchema = new Schema<IWarehouse>(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    location: { type: String, trim: true },
    manager: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

export const Warehouse: Model<IWarehouse> =
  (models.Warehouse as Model<IWarehouse>) || model<IWarehouse>("Warehouse", WarehouseSchema);

export default Warehouse;
