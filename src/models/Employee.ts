import { Schema, model, models, type Model, type Types } from "mongoose";

export const EMPLOYEE_STATUSES = ["active", "on_leave", "suspended", "terminated"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const ID_TYPES = ["iqama", "national_id"] as const;
export type IdType = (typeof ID_TYPES)[number];

export const SPONSORSHIP_TYPES = ["company", "freelancer", "external"] as const;
export type SponsorshipType = (typeof SPONSORSHIP_TYPES)[number];

/**
 * Every expiring document lives in this shape so the dashboard can scan one
 * array instead of a dozen ad-hoc date fields.
 */
export const DOCUMENT_TYPES = [
  "iqama",
  "passport",
  "visa",
  "driving_license",
  "national_id",
  "medical_insurance",
  "work_permit",
  "contract",
  "other",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface IEmployeeDocument {
  _id?: Types.ObjectId;
  type: DocumentType;
  number?: string;
  issueDate?: Date | null;
  expiryDate?: Date | null;
  fileUrl?: string | null;
  notes?: string;
}

export interface IEmployee {
  _id: Types.ObjectId;
  employeeNumber?: string;
  nameAr: string;
  nameEn?: string;
  email?: string;
  phone?: string;
  status: EmployeeStatus;

  // Identity
  idType: IdType;
  idNumber: string;
  nationality: string;
  isSaudi: boolean;
  dateOfBirth?: Date | null;
  passportNumber?: string;
  absherNumber?: string;
  absherStatus?: string;
  professionOnIqama?: string;

  // Employment
  jobTitle?: string;
  department?: Types.ObjectId | null;
  project?: Types.ObjectId | null;
  workLocation?: string;
  hireDate?: Date | null;
  actualWorkStartDate?: Date | null;
  terminationDate?: Date | null;
  sponsorshipType: SponsorshipType;
  isDriver: boolean;

  // Payroll (SAR)
  basicSalary?: number;
  housingAllowance?: number;
  transportAllowance?: number;
  otherAllowance?: number;
  iban?: string;
  bank?: string;
  penaltyClause?: number;

  // Saudi compliance
  crNumber?: string;
  insuranceCompany?: string;
  socialInsuranceStatus?: string;
  fileStatus?: string;

  documents: IEmployeeDocument[];
  photoUrl?: string | null;
  notes?: string;

  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeDocumentSchema = new Schema<IEmployeeDocument>(
  {
    type: { type: String, enum: DOCUMENT_TYPES, required: true },
    number: { type: String, trim: true },
    issueDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null },
    fileUrl: { type: String, default: null },
    notes: { type: String, trim: true },
  },
  { _id: true },
);

const EmployeeSchema = new Schema<IEmployee>(
  {
    employeeNumber: { type: String, trim: true, index: true },
    nameAr: { type: String, required: true, trim: true, index: true },
    nameEn: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    status: { type: String, enum: EMPLOYEE_STATUSES, default: "active", index: true },

    idType: { type: String, enum: ID_TYPES, required: true, default: "iqama" },
    idNumber: { type: String, required: true, trim: true, unique: true, index: true },
    nationality: { type: String, required: true, trim: true, index: true },
    isSaudi: { type: Boolean, default: false, index: true },
    dateOfBirth: { type: Date, default: null },
    passportNumber: { type: String, trim: true },
    absherNumber: { type: String, trim: true },
    absherStatus: { type: String, trim: true },
    professionOnIqama: { type: String, trim: true },

    jobTitle: { type: String, trim: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", default: null, index: true },
    project: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
    workLocation: { type: String, trim: true },
    hireDate: { type: Date, default: null },
    actualWorkStartDate: { type: Date, default: null },
    terminationDate: { type: Date, default: null },
    sponsorshipType: { type: String, enum: SPONSORSHIP_TYPES, default: "company", index: true },
    isDriver: { type: Boolean, default: false, index: true },

    basicSalary: { type: Number, min: 0 },
    housingAllowance: { type: Number, min: 0 },
    transportAllowance: { type: Number, min: 0 },
    otherAllowance: { type: Number, min: 0 },
    iban: { type: String, trim: true, uppercase: true },
    bank: { type: String, trim: true },
    penaltyClause: { type: Number, min: 0 },

    crNumber: { type: String, trim: true },
    insuranceCompany: { type: String, trim: true },
    socialInsuranceStatus: { type: String, trim: true },
    fileStatus: { type: String, trim: true },

    documents: { type: [EmployeeDocumentSchema], default: [] },
    photoUrl: { type: String, default: null },
    notes: { type: String, trim: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

// Free-text search across the fields the Employees table exposes.
EmployeeSchema.index({ nameAr: "text", nameEn: "text", idNumber: "text", employeeNumber: "text" });
// Powers "documents expiring soon" on the HR dashboard.
EmployeeSchema.index({ "documents.expiryDate": 1 });

EmployeeSchema.virtual("totalSalary").get(function (this: IEmployee) {
  return (
    (this.basicSalary ?? 0) +
    (this.housingAllowance ?? 0) +
    (this.transportAllowance ?? 0) +
    (this.otherAllowance ?? 0)
  );
});

EmployeeSchema.set("toJSON", { virtuals: true });
EmployeeSchema.set("toObject", { virtuals: true });

export const Employee: Model<IEmployee> =
  (models.Employee as Model<IEmployee>) || model<IEmployee>("Employee", EmployeeSchema);

export default Employee;
