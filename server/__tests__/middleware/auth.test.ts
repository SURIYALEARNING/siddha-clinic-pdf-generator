import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from '../../middleware/auth';
import type { Response, NextFunction } from 'express';

vi.mock('jsonwebtoken');

function mockReq(headers: Record<string, string> = {}): AuthRequest {
  return { headers } as AuthRequest;
}

function mockRes() {
  const res: Record<string, any> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as unknown as Response & { status: Mock; json: Mock };
}

describe('authMiddleware', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    vi.clearAllMocks();
  });

  it('returns 401 if no Authorization header', () => {
    const req = mockReq();
    const res = mockRes();
    const next: NextFunction = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if header does not start with Bearer', () => {
    const req = mockReq({ authorization: 'Basic token' });
    const res = mockRes();
    const next: NextFunction = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 if token is invalid', () => {
    vi.mocked(jwt.verify).mockImplementation(() => { throw new Error('Invalid'); });
    const req = mockReq({ authorization: 'Bearer invalid-token' });
    const res = mockRes();
    const next: NextFunction = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
  });

  it('sets userId and userEmail on valid token', () => {
    vi.mocked(jwt.verify).mockReturnValue({ userId: '123', email: 'user@test.com' } as any);
    const req = mockReq({ authorization: 'Bearer valid-token' });
    const res = mockRes();
    const next: NextFunction = vi.fn();

    authMiddleware(req, res, next);

    expect(req.userId).toBe('123');
    expect(req.userEmail).toBe('user@test.com');
    expect(next).toHaveBeenCalled();
  });
});
