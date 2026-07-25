import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { Otp } from '../models/Otp';
import { sendOtpEmail } from '../utils/email';
import type { AuthRequest } from '../middleware/auth';

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Invalidate any previous unverified OTPs for this email
    await Otp.deleteMany({ email: email.toLowerCase(), type: 'registration', verified: false });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Otp.create({
      email: email.toLowerCase(),
      otp,
      type: 'registration',
      expiresAt,
    });

    // Send OTP to admin email
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      res.status(500).json({ error: 'Admin email not configured' });
      return;
    }

    await sendOtpEmail(adminEmail, otp, 'registration');

    res.json({
      message: 'OTP sent to admin email for verification. Once approved, complete registration.',
      tempEmail: email.toLowerCase(),
      tempName: name,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function verifyRegistrationOtp(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
      res.status(400).json({ error: 'Name, email, password, and OTP are required' });
      return;
    }

    const otpRecord = await Otp.findOne({
      email: email.toLowerCase(),
      otp,
      type: 'registration',
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      res.status(400).json({ error: 'Invalid or expired OTP' });
      return;
    }

    otpRecord.verified = true;
    await otpRecord.save();

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    const token = generateToken(user._id.toString(), user.email);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user._id.toString(), user.email);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists
      res.json({ message: 'If the email is registered, an OTP has been sent' });
      return;
    }

    // Invalidate previous unverified OTPs
    await Otp.deleteMany({ email: email.toLowerCase(), type: 'forgot-password', verified: false });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.create({
      email: email.toLowerCase(),
      otp,
      type: 'forgot-password',
      expiresAt,
    });

    await sendOtpEmail(email.toLowerCase(), otp, 'forgot-password');

    res.json({ message: 'If the email is registered, an OTP has been sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({ error: 'Email, OTP, and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }

    const otpRecord = await Otp.findOne({
      email: email.toLowerCase(),
      otp,
      type: 'forgot-password',
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      res.status(400).json({ error: 'Invalid or expired OTP' });
      return;
    }

    otpRecord.verified = true;
    await otpRecord.save();

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findOneAndUpdate({ email: email.toLowerCase() }, { password: hashedPassword });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
