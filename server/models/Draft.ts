import mongoose, { Schema, Document } from 'mongoose';

interface IPatientInfo {
  name: string;
  companyName: string;
  address: string;
  country: string;
  phone: string;
  passportId: string;
  date: string;
  invoiceNo: string;
  refNo: string;
  opNo?: string;
  age?: string;
  sex?: string;
  diagnosis?: string;
}

interface IMedicineItem {
  id: string;
  name: string;
  packQty: number;
  unit: string;
  rate: number;
  total: number;
  morning: string;
  noon: string;
  night: string;
  foodInstruction: string;
  remarks: string;
  quantityLabel?: string;
}

export interface IDraft extends Document {
  userId: mongoose.Types.ObjectId;
  patientInfo: IPatientInfo;
  medicines: IMedicineItem[];
  createdAt: Date;
  updatedAt: Date;
}

const PatientInfoSchema = new Schema<IPatientInfo>(
  {
    name: { type: String, default: '' },
    companyName: { type: String, default: '' },
    address: { type: String, default: '' },
    country: { type: String, default: '' },
    phone: { type: String, default: '' },
    passportId: { type: String, default: '' },
    date: { type: String, default: '' },
    invoiceNo: { type: String, default: '' },
    refNo: { type: String, default: '' },
    opNo: { type: String },
    age: { type: String },
    sex: { type: String },
    diagnosis: { type: String },
  },
  { _id: false },
);

const MedicineItemSchema = new Schema<IMedicineItem>(
  {
    id: { type: String, required: true },
    name: { type: String, default: '' },
    packQty: { type: Number, default: 1 },
    unit: { type: String, default: '' },
    rate: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    morning: { type: String, default: '' },
    noon: { type: String, default: '' },
    night: { type: String, default: '' },
    foodInstruction: { type: String, default: '' },
    remarks: { type: String, default: '' },
    quantityLabel: { type: String },
  },
  { _id: false },
);

const DraftSchema = new Schema<IDraft>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientInfo: { type: PatientInfoSchema, default: () => ({}) },
    medicines: { type: [MedicineItemSchema], default: [] },
  },
  { timestamps: true },
);

export const Draft = mongoose.model<IDraft>('Draft', DraftSchema);
