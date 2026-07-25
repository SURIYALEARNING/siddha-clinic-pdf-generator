import { Request, Response } from 'express';
import { Draft } from '../models/Draft';
import type { AuthRequest } from '../middleware/auth';

export async function getDrafts(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req as AuthRequest;
    const drafts = await Draft.find({ userId }).sort({ createdAt: -1 });
    res.json({ drafts });
  } catch (err) {
    console.error('getDrafts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function saveDraft(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req as AuthRequest;
    const { draftId, patientInfo, medicines } = req.body;

    if (draftId) {
      const existing = await Draft.findOne({ _id: draftId, userId });
      if (existing) {
        existing.patientInfo = patientInfo;
        existing.medicines = medicines;
        await existing.save();
        res.json({ draft: existing });
        return;
      }
    }

    const draft = await Draft.create({ userId, patientInfo, medicines });
    res.status(201).json({ draft });
  } catch (err) {
    console.error('saveDraft error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteDraft(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req as AuthRequest;
    const { id } = req.params;
    const draft = await Draft.findOneAndDelete({ _id: id, userId });
    if (!draft) {
      res.status(404).json({ error: 'Draft not found' });
      return;
    }
    res.json({ message: 'Draft deleted' });
  } catch (err) {
    console.error('deleteDraft error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
