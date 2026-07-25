import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function sendOtpEmail(
  to: string,
  otp: string,
  purpose: 'registration' | 'forgot-password',
): Promise<void> {
  const subject =
    purpose === 'registration'
      ? 'New Registration OTP - LHCC'
      : 'Password Reset OTP - LHCC';

  const message =
    purpose === 'registration'
      ? `A new user is trying to register on LHCC.\n\nOTP: ${otp}\n\nThis OTP expires in 10 minutes.\n\nIf you did not request this, please ignore.`
      : `You requested a password reset on LHCC.\n\nOTP: ${otp}\n\nThis OTP expires in 10 minutes.\n\nIf you did not request this, please ignore.`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: message,
    });
  } catch (err) {
    console.error('Failed to send email:', err);
    throw new Error('Failed to send email');
  }
}
