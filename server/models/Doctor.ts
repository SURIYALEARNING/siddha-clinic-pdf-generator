import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
  name: string;
  qualification: string;
  signature: string;
  seal: string;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true, trim: true },
    qualification: { type: String, default: 'B.S.M.S', trim: true },
    signature: { type: String, default: '' },
    seal: { type: String, default: '' },
  },
  { timestamps: true },
);

export const Doctor = mongoose.model<IDoctor>('Doctor', DoctorSchema);
