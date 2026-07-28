import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { Doctor } from '../../models/Doctor';
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from '../../controllers/doctorController';
import type { Request, Response } from 'express';

function mockReq(body: Record<string, any> = {}, params: Record<string, any> = {}, files?: any): Request {
  return { body, params, files, get: vi.fn((h: string) => h === 'host' ? 'localhost:4000' : 'http'), protocol: 'http' } as any;
}

function mockRes() {
  const res: Record<string, any> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as unknown as Response & { status: Mock; json: Mock };
}

describe('Doctor Controller', () => {
  beforeEach(async () => {
    await Doctor.deleteMany({});
  });

  describe('getDoctors', () => {
    it('returns empty list when no doctors', async () => {
      const res = mockRes();
      await getDoctors(mockReq(), res);
      expect(res.json).toHaveBeenCalledWith({ doctors: [] });
    });

    it('returns all doctors', async () => {
      await Doctor.create({ name: 'Dr. A', qualification: 'B.S.M.S' });
      await Doctor.create({ name: 'Dr. B', qualification: 'M.D.' });
      const res = mockRes();
      await getDoctors(mockReq(), res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        doctors: expect.arrayContaining([
          expect.objectContaining({ name: 'Dr. A' }),
          expect.objectContaining({ name: 'Dr. B' }),
        ]),
      }));
    });
  });

  describe('createDoctor', () => {
    it('creates a doctor with minimum fields', async () => {
      const res = mockRes();
      await createDoctor(mockReq({ name: 'Dr. Test' }), res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        doctor: expect.objectContaining({ name: 'Dr. Test' }),
      }));
    });

    it('creates a doctor with custom qualification', async () => {
      const res = mockRes();
      await createDoctor(mockReq({ name: 'Dr. Test', qualification: 'M.D.(Siddha)' }), res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        doctor: expect.objectContaining({ qualification: 'M.D.(Siddha)' }),
      }));
    });

    it('handles file upload URLs', async () => {
      const files = {
        signature: [{ filename: 'sig-123.png' }],
        seal: [{ filename: 'seal-123.png' }],
      };
      const res = mockRes();
      await createDoctor(mockReq({ name: 'Dr. Test' }, {}, files), res);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('updateDoctor', () => {
    it('updates a doctor name', async () => {
      const doc = await Doctor.create({ name: 'Dr. Old' });
      const res = mockRes();
      await updateDoctor(mockReq({ name: 'Dr. New' }, { id: doc._id.toString() }), res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        doctor: expect.objectContaining({ name: 'Dr. New' }),
      }));
    });

    it('returns 404 for non-existent doctor', async () => {
      const res = mockRes();
      await updateDoctor(mockReq({ name: 'Dr. X' }, { id: '507f1f77bcf86cd799439011' }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('applies X-Forwarded-Proto header in URL generation', async () => {
      const doc = await Doctor.create({ name: 'Dr. Proto' });
      const files = { signature: [{ filename: 'sig.png' }] };
      const req = {
        body: { name: 'Dr. Updated' },
        params: { id: doc._id.toString() },
        files,
        get: vi.fn((h: string) => h === 'host' ? 'proxy.com' : 'https'),
        protocol: 'http',
      } as unknown as Request;
      const res = mockRes();
      await updateDoctor(req, res);
      expect(res.json).toHaveBeenCalled();
      const call = (res.json as Mock).mock.calls[0][0];
      expect(call.doctor.signature).toContain('https://proxy.com');
    });

    it('updates file URL with signature upload', async () => {
      const doc = await Doctor.create({ name: 'Dr. Sig' });
      const files = { signature: [{ filename: 'sig-new.png' }] };
      const req = mockReq({ name: 'Dr. Sig' }, { id: doc._id.toString() }, files);
      const res = mockRes();
      await updateDoctor(req, res);
      expect(res.json).toHaveBeenCalled();
      const call = (res.json as Mock).mock.calls[0][0];
      expect(call.doctor.signature).toContain('sig-new.png');
    });

    it('updates file URL with seal upload', async () => {
      const doc = await Doctor.create({ name: 'Dr. Seal' });
      const files = { seal: [{ filename: 'seal-new.png' }] };
      const req = mockReq({ name: 'Dr. Seal' }, { id: doc._id.toString() }, files);
      const res = mockRes();
      await updateDoctor(req, res);
      expect(res.json).toHaveBeenCalled();
      const call = (res.json as Mock).mock.calls[0][0];
      expect(call.doctor.seal).toContain('seal-new.png');
    });
  });

  describe('deleteDoctor', () => {
    it('deletes an existing doctor', async () => {
      const doc = await Doctor.create({ name: 'Dr. Delete' });
      const res = mockRes();
      await deleteDoctor(mockReq({}, { id: doc._id.toString() }), res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Doctor deleted' });
      const found = await Doctor.findById(doc._id);
      expect(found).toBeNull();
    });

    it('returns 404 for non-existent doctor', async () => {
      const res = mockRes();
      await deleteDoctor(mockReq({}, { id: '507f1f77bcf86cd799439011' }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('error handling - catch blocks', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('getDoctors', () => {
      it('returns 500 on database error', async () => {
        vi.spyOn(Doctor, 'find').mockRejectedValueOnce(new Error('DB error'));
        const res = mockRes();
        await getDoctors(mockReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
      });
    });

    describe('createDoctor', () => {
      it('returns 500 on database error', async () => {
        vi.spyOn(Doctor, 'create').mockRejectedValueOnce(new Error('DB error'));
        const res = mockRes();
        await createDoctor(mockReq({ name: 'Dr. Fail' }), res);
        expect(res.status).toHaveBeenCalledWith(500);
      });
    });

    describe('updateDoctor', () => {
      it('returns 500 on database error', async () => {
        vi.spyOn(Doctor, 'findByIdAndUpdate').mockRejectedValueOnce(new Error('DB error'));
        const res = mockRes();
        await updateDoctor(mockReq({ name: 'X' }, { id: '507f1f77bcf86cd799439011' }), res);
        expect(res.status).toHaveBeenCalledWith(500);
      });
    });

    describe('deleteDoctor', () => {
      it('returns 500 on database error', async () => {
        vi.spyOn(Doctor, 'findByIdAndDelete').mockRejectedValueOnce(new Error('DB error'));
        const res = mockRes();
        await deleteDoctor(mockReq({}, { id: '507f1f77bcf86cd799439011' }), res);
        expect(res.status).toHaveBeenCalledWith(500);
      });
    });
  });
});
