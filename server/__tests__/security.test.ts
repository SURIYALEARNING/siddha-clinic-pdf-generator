import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { User } from '../models/User';

const app = express();
app.use(helmet());
app.use(express.json({ limit: '5mb' }));
app.use(mongoSanitize());

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

app.use('/api/auth', authLimiter);
app.post('/api/test/login', (req, res) => {
  const { email, password } = req.body;
  res.json({ email, password });
});

app.post('/api/test/no-sql', (req, res) => {
  res.json({ query: req.body });
});

describe('Security Tests', () => {
  describe('Helmet Security Headers', () => {
    it('includes security headers', async () => {
      const res = await request(app).get('/api/test/login');
      expect(res.headers['x-dns-prefetch-control']).toBe('off');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-xss-protection']).toBe('0');
    });
  });

  describe('Rate Limiting', () => {
    it('blocks requests after limit exceeded', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app).post('/api/auth/register').send({ name: 'Test', email: `test${i}@test.com`, password: 'password123' });
      }
      const res = await request(app).post('/api/auth/register').send({ name: 'Test', email: 'blocked@test.com', password: 'password123' });
      expect(res.status).toBe(429);
      expect(res.body.error).toBe('Too many requests');
    });
  });

  describe('NoSQL Injection Prevention', () => {
    it('sanitizes $ne operator in email', async () => {
      const res = await request(app)
        .post('/api/test/login')
        .send({ email: { $ne: '' }, password: 'password123' });
      expect(res.body.email).not.toHaveProperty('$ne');
    });

    it('sanitizes $gt operator', async () => {
      const res = await request(app)
        .post('/api/test/no-sql')
        .send({ query: { $gt: 1 } });
      expect(res.body.query).not.toHaveProperty('$gt');
    });

    it('sanitizes nested $where operators', async () => {
      const res = await request(app)
        .post('/api/test/login')
        .send({ email: { $where: '1==1' }, password: 'test' });
      expect(res.body.email).not.toHaveProperty('$where');
    });
  });

  describe('Input Size Limits', () => {
    it('rejects oversized request body', async () => {
      const bigBody = { name: 'x'.repeat(6 * 1024 * 1024) };
      const res = await request(app)
        .post('/api/test/login')
        .send(bigBody);
      expect(res.status).toBe(413);
    });
  });
});

describe('Performance Tests', () => {
  it('responds within acceptable time for login endpoint', async () => {
    const start = Date.now();
    await request(app).post('/api/test/login').send({ email: 'test@test.com', password: 'pass' });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000);
  });

  it('concurrently creates multiple users without errors', async () => {
    const promises = Array.from({ length: 5 }, (_, i) =>
      User.create({ name: `Perf User ${i}`, email: `perf${i}@test.com`, password: 'hash' })
    );
    const users = await Promise.all(promises);
    expect(users).toHaveLength(5);
    users.forEach(u => expect(u.email).toMatch(/^perf/));
  });
});
