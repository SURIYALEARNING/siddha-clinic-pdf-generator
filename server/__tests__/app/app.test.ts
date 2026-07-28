import { describe, it, expect } from 'vitest';
import request from 'supertest';

const appModule = await import('../../app');
const app = appModule.app;

describe('Express App (app.ts)', () => {
  describe('health check', () => {
    it('GET /api/health returns ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('404 handling', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not found');
    });

    it('returns 404 for unknown nested routes', async () => {
      const res = await request(app).get('/api/auth/unknown');
      expect(res.status).toBe(404);
    });
  });

  describe('security headers', () => {
    it('includes X-Content-Type-Options header (helmet)', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('includes X-Frame-Options header (helmet)', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });
  });

  describe('CORS', () => {
    it('returns CORS headers for allowed origin', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });
  });

  describe('JSON body parsing', () => {
    it('parses JSON request bodies', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' })
        .set('Content-Type', 'application/json');
      expect(res.status).toBe(401);
    });

    it('rejects malformed JSON', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('not-json');
      expect(res.status).toBe(400);
    });
  });

  describe('mongoSanitize', () => {
    it('strips $ from query parameters in body', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: { $ne: '' } });
      expect(res.status).toBe(401);
    });
  });

  describe('error middleware', () => {
    it('returns 413 for oversized payload', async () => {
      const largeBody = 'x'.repeat(6 * 1024 * 1024);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ data: largeBody });
      expect(res.status).toBe(413);
    });
  });
});
