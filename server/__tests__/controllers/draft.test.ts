import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { Draft } from '../../models/Draft';
import { getDrafts, saveDraft, deleteDraft } from '../../controllers/draftController';
import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth';

function mockAuthReq(body: Record<string, any> = {}, params: Record<string, any> = {}, userId = 'user1'): AuthRequest {
  return { body, params, userId } as AuthRequest;
}

function mockRes() {
  const res: Record<string, any> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as unknown as Response & { status: Mock; json: Mock };
}

describe('Draft Controller', () => {
  beforeEach(async () => {
    await Draft.deleteMany({});
  });

  describe('getDrafts', () => {
    it('returns empty list when no drafts', async () => {
      const res = mockRes();
      await getDrafts(mockAuthReq(), res);
      expect(res.json).toHaveBeenCalledWith({ drafts: [] });
    });

    it('excludes soft-deleted drafts', async () => {
      await Draft.create({ patientInfo: { name: 'Active' }, medicines: [] });
      await Draft.create({ patientInfo: { name: 'Deleted' }, medicines: [], isDeleted: true });
      const res = mockRes();
      await getDrafts(mockAuthReq(), res);
      const drafts = (res.json.mock.calls[0][0] as any).drafts;
      expect(drafts).toHaveLength(1);
      expect(drafts[0].patientInfo.name).toBe('Active');
    });
  });

  describe('saveDraft', () => {
    it('creates a new draft', async () => {
      const res = mockRes();
      const data = { patientInfo: { name: 'Test Patient' }, medicines: [{ id: 'm1', name: 'Med A' }] };
      await saveDraft(mockAuthReq(data), res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        draft: expect.objectContaining({
          patientInfo: expect.objectContaining({ name: 'Test Patient' }),
        }),
      }));
    });

    it('updates an existing draft when draftId provided', async () => {
      const draft = await Draft.create({ patientInfo: { name: 'Old' }, medicines: [] });
      const res = mockRes();
      await saveDraft(mockAuthReq({ draftId: draft._id.toString(), patientInfo: { name: 'Updated' }, medicines: [] }), res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        draft: expect.objectContaining({
          patientInfo: expect.objectContaining({ name: 'Updated' }),
        }),
      }));
    });
  });

  describe('deleteDraft', () => {
    it('soft-deletes a draft', async () => {
      const draft = await Draft.create({ patientInfo: { name: 'To Delete' }, medicines: [] });
      const res = mockRes();
      await deleteDraft(mockAuthReq({}, { id: draft._id.toString() }, 'user1'), res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Draft deleted' });
      const updated = await Draft.findById(draft._id);
      expect(updated?.isDeleted).toBe(true);
      expect(updated?.deletedBy).toBe('user1');
    });

    it('returns 404 for non-existent draft', async () => {
      const res = mockRes();
      await deleteDraft(mockAuthReq({}, { id: '507f1f77bcf86cd799439011' }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('error handling - catch blocks', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('getDrafts', () => {
      it('returns 500 on database error', async () => {
        vi.spyOn(Draft, 'find').mockRejectedValueOnce(new Error('DB error'));
        const res = mockRes();
        await getDrafts(mockAuthReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
      });
    });

    describe('saveDraft', () => {
      it('returns 500 on database error creating', async () => {
        vi.spyOn(Draft, 'create').mockRejectedValueOnce(new Error('DB error'));
        const res = mockRes();
        await saveDraft(mockAuthReq({ patientInfo: { name: 'P' }, medicines: [] }), res);
        expect(res.status).toHaveBeenCalledWith(500);
      });

      it('returns 500 on database error finding existing draft', async () => {
        vi.spyOn(Draft, 'findById').mockRejectedValueOnce(new Error('DB error'));
        const res = mockRes();
        await saveDraft(mockAuthReq({ draftId: '507f1f77bcf86cd799439011', patientInfo: { name: 'P' }, medicines: [] }), res);
        expect(res.status).toHaveBeenCalledWith(500);
      });
    });

    describe('deleteDraft', () => {
      it('returns 500 on database error', async () => {
        vi.spyOn(Draft, 'findByIdAndUpdate').mockRejectedValueOnce(new Error('DB error'));
        const res = mockRes();
        await deleteDraft(mockAuthReq({}, { id: '507f1f77bcf86cd799439011' }), res);
        expect(res.status).toHaveBeenCalledWith(500);
      });
    });
  });
});
