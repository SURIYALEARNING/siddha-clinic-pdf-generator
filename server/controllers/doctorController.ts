import { Request, Response } from 'express';
import { Doctor } from '../models/Doctor';

function getFileUrl(req: Request, filename: string): string {
  const protocol = (req.get('X-Forwarded-Proto') || req.protocol) as string;
  return `${protocol}://${req.get('host')}/uploads/doctors/${filename}`;
}

export async function getDoctors(_req: Request, res: Response): Promise<void> {
  try {
    const doctors = await Doctor.find().sort({ createdAt: -1 });
    res.json({ doctors });
  } catch (err) {
    console.error('getDoctors error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createDoctor(req: Request, res: Response): Promise<void> {
  try {
    const { name, qualification } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    let signatureUrl = '';
    let sealUrl = '';

    if (files?.signature?.[0]) {
      signatureUrl = getFileUrl(req, files.signature[0].filename);
    }
    if (files?.seal?.[0]) {
      sealUrl = getFileUrl(req, files.seal[0].filename);
    }

    const doctor = await Doctor.create({
      name: name.trim(),
      qualification: qualification?.trim() || 'B.S.M.S',
      signature: signatureUrl,
      seal: sealUrl,
    });
    res.status(201).json({ doctor });
  } catch (err) {
    console.error('createDoctor error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateDoctor(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, qualification } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const updateData: Record<string, string> = {};

    if (name) updateData.name = name;
    if (qualification) updateData.qualification = qualification;
    if (files?.signature?.[0]) {
      updateData.signature = getFileUrl(req, files.signature[0].filename);
    }
    if (files?.seal?.[0]) {
      updateData.seal = getFileUrl(req, files.seal[0].filename);
    }

    const doctor = await Doctor.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }
    res.json({ doctor });
  } catch (err) {
    console.error('updateDoctor error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteDoctor(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findByIdAndDelete(id);
    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }
    res.json({ message: 'Doctor deleted' });
  } catch (err) {
    console.error('deleteDoctor error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
