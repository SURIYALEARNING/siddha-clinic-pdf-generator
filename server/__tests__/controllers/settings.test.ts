import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { Setting } from '../../models/Setting';
import { getSettings, upsertSettings } from '../../controllers/settingController';
import type { Request, Response } from 'express';

function mockReq(body: Record<string, any> = {}): Request {
  return { body } as Request;
}

function mockRes() {
  const res: Record<string, any> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as unknown as Response & { status: Mock; json: Mock };
}

describe('Settings Controller', () => {
  beforeEach(async () => {
    await Setting.deleteMany({});
  });

  describe('getSettings', () => {
    it('returns null when no settings exist', async () => {
      const res = mockRes();
      await getSettings(mockReq(), res);
      expect(res.json).toHaveBeenCalledWith({ settings: null });
    });

    it('returns the latest settings', async () => {
      await Setting.create({ name: 'Old Clinic', logo: '', address: '', phone: '', email: '', website: '', signature: '', footerText: '', selectedDoctorId: '' });
      await new Promise(r => setTimeout(r, 10));
      await Setting.create({ name: 'New Clinic', logo: '', address: '', phone: '', email: '', website: '', signature: '', footerText: '', selectedDoctorId: '' });
      const res = mockRes();
      await getSettings(mockReq(), res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        settings: expect.objectContaining({ name: 'New Clinic' }),
      }));
    });
  });

  describe('upsertSettings', () => {
    it('creates settings when none exist', async () => {
      const res = mockRes();
      await upsertSettings(mockReq({ name: 'My Clinic', address: '123 Street', phone: '1234567890', email: 'clinic@test.com', website: 'clinic.com', logo: '', signature: '', footerText: 'Thank you', selectedDoctorId: '' }), res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        settings: expect.objectContaining({ name: 'My Clinic' }),
      }));
    });

    it('updates existing settings', async () => {
      await Setting.create({ name: 'Old', logo: '', address: '', phone: '', email: '', website: '', signature: '', footerText: '', selectedDoctorId: '' });
      const res = mockRes();
      await upsertSettings(mockReq({ name: 'Updated Clinic', address: '456 Avenue', phone: '9876543210', email: 'new@test.com', website: 'new.com', logo: '', signature: '', footerText: 'Welcome', selectedDoctorId: 'doc1' }), res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        settings: expect.objectContaining({ name: 'Updated Clinic' }),
      }));
      const count = await Setting.countDocuments({});
      expect(count).toBe(1);
    });
  });

  describe('error handling - catch blocks', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('getSettings', () => {
      it('returns 500 on database error', async () => {
        vi.spyOn(Setting, 'findOne').mockRejectedValueOnce(new Error('DB error'));
        const res = mockRes();
        await getSettings(mockReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
      });
    });

    describe('upsertSettings', () => {
      it('returns 500 on database error', async () => {
        vi.spyOn(Setting, 'findOneAndUpdate').mockRejectedValueOnce(new Error('DB error'));
        const res = mockRes();
        await upsertSettings(mockReq({ name: 'Fail Clinic' }), res);
        expect(res.status).toHaveBeenCalledWith(500);
      });
    });
  });
});
