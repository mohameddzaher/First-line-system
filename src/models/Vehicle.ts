import { Schema, model, models, type Model, type Types } from "mongoose";

export const VEHICLE_TYPES = ["car", "motorcycle", "heavy_truck"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_STATUSES = [
  "authorized",   // يعمل + مُفوَّضة على مندوب
  "available",    // جاهزة / متاحة
  "parked",       // موقوفة
  "maintenance",  // صيانة
  "no_plate",     // بدون لوحة
  "impounded",    // محتجز عليها
  "withdrawn",    // مسحوبة
  "stolen",       // مسروقة
  "out_of_service", // خارج الخدمة / تلفيات
] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const SERVICE_TIERS = ["standard", "express"] as const;
export type ServiceTier = (typeof SERVICE_TIERS)[number];

/**
 * One authorization (تفويض قيادة) in the vehicle's life. The current holder is the
 * most recent entry with no endDate. Transferring closes the open one and opens a
 * new one, so the vehicle profile shows the full custody chain over time.
 */
export interface IAuthorization {
  _id?: Types.ObjectId;
  employee: Types.ObjectId;
  startDate: Date;
  endDate?: Date | null;
  authorizationType: string;
  /** Custody record created for this authorization, linking fleet <-> HR custody. */
  custody?: Types.ObjectId | null;
  note?: string;
}

export interface IVehicle {
  _id: Types.ObjectId;
  plateNumber: string;
  /** Latin plate (Plate#), e.g. "9210GTA". */
  plateLatin?: string;
  type: VehicleType;
  make?: string;
  makeModel?: string;
  year?: number;
  color?: string;
  status: VehicleStatus;
  /** Operating city (Jeddah, Dammam, ...). */
  city?: string;
  /** Chassis / VIN number. */
  chassisNumber?: string;
  /** Ownership, e.g. "ملك الشركة". */
  ownership?: string;
  purchasePrice?: number;
  /** Standard vs express (الخط الأسرع) service tier. */
  serviceTier?: ServiceTier;
  /** Free-text condition note (e.g. "مسروق بالمدينة المنورة"). */
  conditionNote?: string;
  department?: Types.ObjectId | null;
  project?: Types.ObjectId | null;
  /** The employee currently authorized (denormalised for fast lists/filtering). */
  currentAuthorization?: {
    employee: Types.ObjectId;
    startDate: Date;
    authorizationType: string;
  } | null;
  authorizations: IAuthorization[];
  registrationExpiry?: Date | null;
  insuranceExpiry?: Date | null;
  notes?: string;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const AuthorizationSchema = new Schema<IAuthorization>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, default: null },
    authorizationType: { type: String, default: "تفويض قيادة" },
    custody: { type: Schema.Types.ObjectId, ref: "Custody", default: null },
    note: { type: String, trim: true },
  },
  { _id: true },
);

const VehicleSchema = new Schema<IVehicle>(
  {
    plateNumber: { type: String, required: true, trim: true, unique: true, index: true },
    plateLatin: { type: String, trim: true },
    type: { type: String, enum: VEHICLE_TYPES, required: true, index: true },
    make: { type: String, trim: true },
    makeModel: { type: String, trim: true },
    year: { type: Number },
    color: { type: String, trim: true },
    status: { type: String, enum: VEHICLE_STATUSES, default: "available", index: true },
    city: { type: String, trim: true, index: true },
    chassisNumber: { type: String, trim: true },
    ownership: { type: String, trim: true },
    purchasePrice: { type: Number, min: 0 },
    serviceTier: { type: String, enum: SERVICE_TIERS, default: "standard" },
    conditionNote: { type: String, trim: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", default: null, index: true },
    project: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
    currentAuthorization: {
      type: new Schema(
        {
          employee: { type: Schema.Types.ObjectId, ref: "Employee" },
          startDate: Date,
          authorizationType: String,
        },
        { _id: false },
      ),
      default: null,
    },
    authorizations: { type: [AuthorizationSchema], default: [] },
    registrationExpiry: { type: Date, default: null },
    insuranceExpiry: { type: Date, default: null },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

VehicleSchema.index({ plateNumber: "text", makeModel: "text" });
VehicleSchema.index({ "currentAuthorization.employee": 1 });

export const Vehicle: Model<IVehicle> =
  (models.Vehicle as Model<IVehicle>) || model<IVehicle>("Vehicle", VehicleSchema);

export default Vehicle;
