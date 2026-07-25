import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otp: string;
  type: 'registration' | 'forgot-password';
  expiresAt: Date;
  verified: boolean;
}

const otpSchema = new Schema<IOtp>({
  email: { type: String, required: true, lowercase: true, trim: true },
  otp: { type: String, required: true },
  type: { type: String, enum: ['registration', 'forgot-password'], required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = mongoose.model<IOtp>('Otp', otpSchema);
