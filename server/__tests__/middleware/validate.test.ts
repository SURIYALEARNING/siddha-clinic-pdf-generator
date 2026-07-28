import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
  validateRegister, validateLogin, validateVerifyOtp,
  validateForgotPassword, validateResetPassword,
  validateCreateDoctor, validateIdParam, validateSaveDraft,
} from '../../middleware/validate';

function createApp(...middleware: any[]) {
  const app = express();
  app.use(express.json());
  app.post('/test', ...middleware, (req, res) => {
    res.json({ ok: true });
  });
  return app;
}

describe('Validation Middleware', () => {
  describe('validateRegister', () => {
    it('passes with valid data', async () => {
      const app = createApp(validateRegister);
      const res = await request(app).post('/test').send({ name: 'Test', email: 'test@test.com', password: 'password123' });
      expect(res.status).toBe(200);
    });

    it('fails with missing name', async () => {
      const app = createApp(validateRegister);
      const res = await request(app).post('/test').send({ email: 'test@test.com', password: 'password123' });
      expect(res.status).toBe(400);
    });

    it('fails with invalid email', async () => {
      const app = createApp(validateRegister);
      const res = await request(app).post('/test').send({ name: 'Test', email: 'notanemail', password: 'password123' });
      expect(res.status).toBe(400);
    });

    it('fails with short password', async () => {
      const app = createApp(validateRegister);
      const res = await request(app).post('/test').send({ name: 'Test', email: 'test@test.com', password: '123' });
      expect(res.status).toBe(400);
    });
  });

  describe('validateLogin', () => {
    it('passes with valid data', async () => {
      const app = createApp(validateLogin);
      const res = await request(app).post('/test').send({ email: 'test@test.com', password: 'pass' });
      expect(res.status).toBe(200);
    });

    it('fails with missing email', async () => {
      const app = createApp(validateLogin);
      const res = await request(app).post('/test').send({ password: 'pass' });
      expect(res.status).toBe(400);
    });

    it('fails with missing password', async () => {
      const app = createApp(validateLogin);
      const res = await request(app).post('/test').send({ email: 'test@test.com' });
      expect(res.status).toBe(400);
    });
  });

  describe('validateVerifyOtp', () => {
    it('passes with valid data', async () => {
      const app = createApp(validateVerifyOtp);
      const res = await request(app).post('/test').send({ name: 'Test', email: 'test@test.com', password: 'password123', otp: '123456' });
      expect(res.status).toBe(200);
    });

    it('fails with invalid OTP length', async () => {
      const app = createApp(validateVerifyOtp);
      const res = await request(app).post('/test').send({ name: 'Test', email: 'test@test.com', password: 'password123', otp: '12345' });
      expect(res.status).toBe(400);
    });
  });

  describe('validateForgotPassword', () => {
    it('passes with valid email', async () => {
      const app = createApp(validateForgotPassword);
      const res = await request(app).post('/test').send({ email: 'test@test.com' });
      expect(res.status).toBe(200);
    });

    it('fails with empty email', async () => {
      const app = createApp(validateForgotPassword);
      const res = await request(app).post('/test').send({ email: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('validateResetPassword', () => {
    it('passes with valid data', async () => {
      const app = createApp(validateResetPassword);
      const res = await request(app).post('/test').send({ email: 'test@test.com', otp: '123456', newPassword: 'newpassword123' });
      expect(res.status).toBe(200);
    });

    it('fails with short new password', async () => {
      const app = createApp(validateResetPassword);
      const res = await request(app).post('/test').send({ email: 'test@test.com', otp: '123456', newPassword: '123' });
      expect(res.status).toBe(400);
    });
  });

  describe('validateCreateDoctor', () => {
    it('passes with name', async () => {
      const app = createApp(validateCreateDoctor);
      const res = await request(app).post('/test').send({ name: 'Dr. Test' });
      expect(res.status).toBe(200);
    });

    it('fails without name', async () => {
      const app = createApp(validateCreateDoctor);
      const res = await request(app).post('/test').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('validateIdParam', () => {
    function createAppWithParam(...middleware: any[]) {
      const app = express();
      app.use(express.json());
      app.post('/test/:id', ...middleware, (req, res) => {
        res.json({ ok: true });
      });
      return app;
    }

    it('passes with valid MongoID', async () => {
      const app = createAppWithParam(validateIdParam);
      const res = await request(app).post('/test/507f1f77bcf86cd799439011');
      expect(res.status).toBe(200);
    });

    it('fails with invalid ID', async () => {
      const app = createAppWithParam(validateIdParam);
      const res = await request(app).post('/test/invalid');
      expect(res.status).toBe(400);
    });
  });

  describe('validateSaveDraft', () => {
    it('passes with valid draft data', async () => {
      const app = createApp(validateSaveDraft);
      const res = await request(app).post('/test').send({ patientInfo: { name: 'P' }, medicines: [] });
      expect(res.status).toBe(200);
    });

    it('fails without patientInfo', async () => {
      const app = createApp(validateSaveDraft);
      const res = await request(app).post('/test').send({ medicines: [] });
      expect(res.status).toBe(400);
    });

    it('fails without medicines array', async () => {
      const app = createApp(validateSaveDraft);
      const res = await request(app).post('/test').send({ patientInfo: { name: 'P' } });
      expect(res.status).toBe(400);
    });
  });
});
