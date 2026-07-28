import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { User } from '../../models/User';
import { Otp } from '../../models/Otp';
import { register, login, verifyRegistrationOtp, forgotPassword, resetPassword, getMe } from '../../controllers/authController';
import type { Request, Response } from 'express';
import type { AuthRequest } from '../../middleware/auth';

vi.mock('../../utils/email', () => ({
  sendOtpEmail: vi.fn(),
}));

function mockReq(body: Record<string, any> = {}): Request {
  return { body } as Request;
}

function mockAuthReq(body: Record<string, any> = {}, userId?: string): AuthRequest {
  return { body, userId } as AuthRequest;
}

function mockRes() {
  const res: Record<string, any> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as unknown as Response & { status: Mock; json: Mock };
}

describe('Auth Controller', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Otp.deleteMany({});
    process.env.ADMIN_EMAIL = 'admin@test.com';
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('register', () => {
    it('returns 400 if fields missing', async () => {
      const res = mockRes();
      await register(mockReq({}), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 409 if email already registered', async () => {
      await User.create({ name: 'Existing', email: 'test@test.com', password: 'hash' });
      const res = mockRes();
      await register(mockReq({ name: 'Test', email: 'test@test.com', password: 'password123' }), res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('creates OTP and returns success', async () => {
      const res = mockRes();
      await register(mockReq({ name: 'Test', email: 'test@test.com', password: 'password123' }), res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('OTP') }));
    });
  });

  describe('verifyRegistrationOtp', () => {
    it('returns 400 if fields missing', async () => {
      const res = mockRes();
      await verifyRegistrationOtp(mockReq({}), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 if OTP is invalid', async () => {
      const res = mockRes();
      await verifyRegistrationOtp(mockReq({ name: 'Test', email: 'test@test.com', password: 'pass', otp: '000000' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('registers user with valid OTP', async () => {
      const otp = await Otp.create({
        email: 'test@test.com', otp: '123456', type: 'registration',
        expiresAt: new Date(Date.now() + 600000),
      });
      const res = mockRes();
      await verifyRegistrationOtp(mockReq({ name: 'Test', email: 'test@test.com', password: 'password123', otp: '123456' }), res);
      expect(res.status).toHaveBeenCalledWith(201);
      const user = await User.findOne({ email: 'test@test.com' });
      expect(user).toBeTruthy();
    });
  });

  describe('login', () => {
    it('returns 400 if fields missing', async () => {
      const res = mockRes();
      await login(mockReq({}), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 for invalid email', async () => {
      const res = mockRes();
      await login(mockReq({ email: 'nonexistent@test.com', password: 'pass' }), res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 for wrong password', async () => {
      const bcrypt = await import('bcryptjs');
      const hash = await bcrypt.hash('correctpass', 4);
      await User.create({ name: 'Test', email: 'test@test.com', password: hash });
      const res = mockRes();
      await login(mockReq({ email: 'test@test.com', password: 'wrongpass' }), res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns token on successful login', async () => {
      const bcrypt = await import('bcryptjs');
      const hash = await bcrypt.hash('correctpass', 4);
      await User.create({ name: 'Test', email: 'test@test.com', password: hash });
      const res = mockRes();
      await login(mockReq({ email: 'test@test.com', password: 'correctpass' }), res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }));
    });
  });

  describe('forgotPassword', () => {
    it('returns same message regardless of user existence', async () => {
      const res1 = mockRes();
      const res2 = mockRes();
      await forgotPassword(mockReq({ email: 'exists@test.com' }), res1);
      await forgotPassword(mockReq({ email: 'notexists@test.com' }), res2);
      expect(res1.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
      expect(res2.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
    });

    it('creates OTP for existing user', async () => {
      await User.create({ name: 'Test', email: 'test@test.com', password: 'hash' });
      const res = mockRes();
      await forgotPassword(mockReq({ email: 'test@test.com' }), res);
      const otp = await Otp.findOne({ email: 'test@test.com', type: 'forgot-password' });
      expect(otp).toBeTruthy();
    });
  });

  describe('resetPassword', () => {
    it('returns 400 if fields missing', async () => {
      const res = mockRes();
      await resetPassword(mockReq({}), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 for invalid OTP', async () => {
      const res = mockRes();
      await resetPassword(mockReq({ email: 'test@test.com', otp: '000000', newPassword: 'newpass123' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('resets password with valid OTP', async () => {
      await User.create({ name: 'Test', email: 'test@test.com', password: 'oldhash' });
      await Otp.create({
        email: 'test@test.com', otp: '123456', type: 'forgot-password',
        expiresAt: new Date(Date.now() + 600000),
      });
      const res = mockRes();
      await resetPassword(mockReq({ email: 'test@test.com', otp: '123456', newPassword: 'newpassword123' }), res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Password reset successfully' });
    });
  });

  describe('getMe', () => {
    it('returns 404 if user not found', async () => {
      const res = mockRes();
      await getMe(mockAuthReq({}, '507f1f77bcf86cd799439011'), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns user data', async () => {
      const user = await User.create({ name: 'Test', email: 'test@test.com', password: 'hash' });
      const res = mockRes();
      await getMe(mockAuthReq({}, user._id.toString()), res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({ name: 'Test' }),
      }));
    });
  });

  describe('error handling - catch blocks', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('register', () => {
      it('returns 400 when password is too short', async () => {
        const res = mockRes();
        await register(mockReq({ name: 'Test', email: 'test@test.com', password: '12345' }), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Password must be at least 6 characters' });
      });

      it('returns 500 when ADMIN_EMAIL is not set', async () => {
        const orig = process.env.ADMIN_EMAIL;
        delete process.env.ADMIN_EMAIL;
        const res = mockRes();
        await register(mockReq({ name: 'Test', email: 'new@test.com', password: 'password123' }), res);
        expect(res.status).toHaveBeenCalledWith(500);
        process.env.ADMIN_EMAIL = orig;
      });

      it('returns 500 when sendOtpEmail fails', async () => {
        const { sendOtpEmail } = await import('../../utils/email');
        (sendOtpEmail as Mock).mockRejectedValueOnce(new Error('SMTP error'));
        const res = mockRes();
        await register(mockReq({ name: 'Test', email: 'new@test.com', password: 'password123' }), res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
      });

      it('returns 500 on database error in User.findOne', async () => {
        vi.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('DB error'));
        const res = mockRes();
        await register(mockReq({ name: 'Test', email: 'db@test.com', password: 'password123' }), res);
        expect(res.status).toHaveBeenCalledWith(500);
      });
    });

    describe('verifyRegistrationOtp', () => {
      it('returns 500 on database error', async () => {
        vi.spyOn(Otp, 'findOne').mockRejectedValueOnce(new Error('DB error'));
        const res = mockRes();
        await verifyRegistrationOtp(mockReq({ name: 'T', email: 't@t.com', password: 'pass123', otp: '123456' }), res);
        expect(res.status).toHaveBeenCalledWith(500);
      });
    });

    describe('login', () => {
      it('returns 500 on database error', async () => {
        vi.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('DB error'));
        const res = mockRes();
        await login(mockReq({ email: 'x@x.com', password: 'pass' }), res);
        expect(res.status).toHaveBeenCalledWith(500);
      });
    });

    describe('forgotPassword', () => {
      it('returns 500 on database error', async () => {
        vi.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('DB error'));
        const res = mockRes();
        await forgotPassword(mockReq({ email: 'x@x.com' }), res);
        expect(res.status).toHaveBeenCalledWith(500);
      });
    });

    describe('resetPassword', () => {
      it('returns 500 on database error', async () => {
        vi.spyOn(Otp, 'findOne').mockRejectedValueOnce(new Error('DB error'));
        const res = mockRes();
        await resetPassword(mockReq({ email: 't@t.com', otp: '123456', newPassword: 'newpass123' }), res);
        expect(res.status).toHaveBeenCalledWith(500);
      });
    });

    describe('getMe', () => {
      it('returns 500 on database error', async () => {
        vi.spyOn(User, 'findById').mockRejectedValueOnce(new Error('DB error'));
        const res = mockRes();
        await getMe(mockAuthReq({}, '507f1f77bcf86cd799439011'), res);
        expect(res.status).toHaveBeenCalledWith(500);
      });
    });
  });
});
