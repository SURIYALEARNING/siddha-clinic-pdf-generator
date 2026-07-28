import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import { User } from '../../models/User';
import { Otp } from '../../models/Otp';
import authRoutes from '../../routes/auth';
import doctorRoutes from '../../routes/doctor';
import draftRoutes from '../../routes/draft';
import settingsRoutes from '../../routes/settings';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(mongoSanitize());
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/settings', settingsRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    it('returns ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('returns 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown');
      expect(res.status).toBe(404);
    });
  });

  describe('Auth - Registration Flow', () => {
    it('registers, verifies OTP, and logs in successfully', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Integration Test', email: 'integ@test.com', password: 'password123' });
      expect(registerRes.status).toBe(200);
      expect(registerRes.body.message).toContain('OTP');

      const otpRecord = await Otp.findOne({ email: 'integ@test.com', type: 'registration' });
      expect(otpRecord).toBeTruthy();

      const verifyRes = await request(app)
        .post('/api/auth/verify-registration-otp')
        .send({ name: 'Integration Test', email: 'integ@test.com', password: 'password123', otp: otpRecord!.otp });
      expect(verifyRes.status).toBe(201);
      expect(verifyRes.body.token).toBeTruthy();
      expect(verifyRes.body.user.email).toBe('integ@test.com');

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'integ@test.com', password: 'password123' });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.token).toBeTruthy();
    });

    it('rejects duplicate email registration', async () => {
      await User.create({ name: 'Existing', email: 'dup@test.com', password: 'hash' });
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Duplicate', email: 'dup@test.com', password: 'password123' });
      expect(res.status).toBe(409);
    });

    it('rejects invalid OTP verification', async () => {
      const res = await request(app)
        .post('/api/auth/verify-registration-otp')
        .send({ name: 'Test', email: 'test@test.com', password: 'pass123', otp: '000000' });
      expect(res.status).toBe(400);
    });
  });

  describe('Auth - Password Reset Flow', () => {
    it('sends forgot-password OTP and resets password', async () => {
      await User.create({ name: 'Reset User', email: 'reset@test.com', password: 'oldhash' });

      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'reset@test.com' });
      expect(forgotRes.status).toBe(200);

      const otpRecord = await Otp.findOne({ email: 'reset@test.com', type: 'forgot-password' });
      expect(otpRecord).toBeTruthy();

      const resetRes = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'reset@test.com', otp: otpRecord!.otp, newPassword: 'newpassword123' });
      expect(resetRes.status).toBe(200);
      expect(resetRes.body.message).toBe('Password reset successfully');
    });
  });

  describe('Protected Endpoints', () => {
    let token: string;

    beforeEach(async () => {
      const user = await User.create({ name: 'Auth User', email: 'auth@test.com', password: 'hash' });
      token = jwt.sign({ userId: user._id.toString(), email: user.email }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '7d' });
    });

    it('rejects requests without token', async () => {
      const res = await request(app).get('/api/doctors');
      expect(res.status).toBe(401);
    });

    it('rejects requests with invalid token', async () => {
      const res = await request(app).get('/api/doctors').set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });

    it('GET /api/auth/me returns current user', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('auth@test.com');
    });

    it('GET /api/doctors returns doctors list', async () => {
      const res = await request(app).get('/api/doctors').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.doctors).toBeInstanceOf(Array);
    });

    it('POST /api/doctors creates and deletes a doctor', async () => {
      const createRes = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${token}`)
        .field('name', 'Dr. Integration')
        .field('qualification', 'B.S.M.S');
      expect(createRes.status).toBe(201);
      expect(createRes.body.doctor.name).toBe('Dr. Integration');

      const doctorId = createRes.body.doctor._id;

      const updateRes = await request(app)
        .put(`/api/doctors/${doctorId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Dr. Updated' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.doctor.name).toBe('Dr. Updated');

      const deleteRes = await request(app)
        .delete(`/api/doctors/${doctorId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(deleteRes.status).toBe(200);
    });
  });

  describe('Draft CRUD', () => {
    let token: string;
    let draftId: string;

    beforeEach(async () => {
      const user = await User.create({ name: 'Draft User', email: 'draft@test.com', password: 'hash' });
      token = jwt.sign({ userId: user._id.toString(), email: user.email }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '7d' });
    });

    it('creates, lists, updates, and soft-deletes a draft', async () => {
      const createRes = await request(app)
        .post('/api/drafts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          patientInfo: { name: 'Test Patient', country: 'India' },
          medicines: [{ id: 'm1', name: 'Medicine A', packQty: 1, unit: 'Pack', rate: 100, total: 100, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' }],
        });
      expect(createRes.status).toBe(201);
      expect(createRes.body.draft.patientInfo.name).toBe('Test Patient');
      draftId = createRes.body.draft._id;

      const listRes = await request(app).get('/api/drafts').set('Authorization', `Bearer ${token}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.drafts.length).toBeGreaterThanOrEqual(1);

      const updateRes = await request(app)
        .post('/api/drafts')
        .set('Authorization', `Bearer ${token}`)
        .send({ draftId, patientInfo: { name: 'Updated Patient', country: 'India' }, medicines: [] });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.draft.patientInfo.name).toBe('Updated Patient');

      const deleteRes = await request(app)
        .delete(`/api/drafts/${draftId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(deleteRes.status).toBe(200);
    });
  });

  describe('Settings', () => {
    let token: string;

    beforeEach(async () => {
      const user = await User.create({ name: 'Settings User', email: 'settings@test.com', password: 'hash' });
      token = jwt.sign({ userId: user._id.toString(), email: user.email }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '7d' });
    });

    it('upserts and retrieves settings', async () => {
      const upsertRes = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Clinic', address: '123 Test St', phone: '1234567890',
          email: 'test@clinic.com', website: 'test.com', logo: '', signature: '',
          footerText: 'Thanks', selectedDoctorId: '',
        });
      expect(upsertRes.status).toBe(200);
      expect(upsertRes.body.settings.name).toBe('Test Clinic');

      const getRes = await request(app).get('/api/settings').set('Authorization', `Bearer ${token}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.settings).toBeTruthy();
      expect(getRes.body.settings.name).toBe('Test Clinic');
    });
  });
});
