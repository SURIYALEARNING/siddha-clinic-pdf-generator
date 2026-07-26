import { Request, Response } from 'express';
import { Setting } from '../models/Setting';

export async function getSettings(_req: Request, res: Response): Promise<void> {
  try {
    const settings = await Setting.findOne().sort({ createdAt: -1 });
    res.json({ settings });
  } catch (err) {
    console.error('getSettings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function upsertSettings(req: Request, res: Response): Promise<void> {
  try {
    const { logo, name, address, phone, email, website, signature, footerText, selectedDoctorId } = req.body;

    const settings = await Setting.findOneAndUpdate(
      {},
      { logo, name, address, phone, email, website, signature, footerText, selectedDoctorId },
      { upsert: true, new: true, runValidators: true },
    );

    res.json({ settings });
  } catch (err) {
    console.error('upsertSettings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
