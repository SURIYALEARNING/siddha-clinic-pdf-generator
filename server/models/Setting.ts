import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  logo: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  signature: string;
  footerText: string;
  selectedDoctorId: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    logo: { type: String, default: '' },
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    signature: { type: String, default: '' },
    footerText: { type: String, default: '' },
    selectedDoctorId: { type: String, default: '' },
  },
  { timestamps: true },
);

export const Setting = mongoose.model<ISetting>('Setting', SettingSchema);
