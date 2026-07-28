import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { uploadDoctorImages } from '../../middleware/upload';

const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads', 'doctors');

function cleanUploadsDir() {
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    for (const f of files) {
      fs.unlinkSync(path.join(uploadsDir, f));
    }
  }
}

function createApp() {
  const app = express();
  app.post('/upload', (req: any, res: any) => {
    uploadDoctorImages(req, res, (err: any) => {
      if (err) {
        res.status(400).json({ error: err.message || 'Upload error' });
        return;
      }
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      res.json({
        files: Object.fromEntries(
          Object.entries(files || {}).map(([k, v]) => [k, v[0]?.filename || 'none'])
        ),
      });
    });
  });
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ error: `Unexpected field: ${err.field}` });
      return;
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File too large' });
      return;
    }
    res.status(400).json({ error: err.message });
  });
  return app;
}

function createTestBuffer(mimeType: string): Buffer {
  if (mimeType === 'image/png') return Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (mimeType === 'image/jpeg') return Buffer.from([255, 216, 255]);
  if (mimeType === 'image/webp') return Buffer.from([82, 73, 70, 70]);
  return Buffer.from('test content');
}

beforeEach(() => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  cleanUploadsDir();
});

afterAll(() => {
  cleanUploadsDir();
});

describe('Upload Middleware', () => {
  describe('valid image types', () => {
    it('accepts jpg', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/upload')
        .attach('signature', createTestBuffer('image/jpeg'), 'photo.jpg');
      expect(res.status).toBe(200);
      expect(res.body.files.signature).toMatch(/^signature-\d+\.jpg$/);
    });

    it('accepts jpeg', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/upload')
        .attach('signature', createTestBuffer('image/jpeg'), 'photo.jpeg');
      expect(res.status).toBe(200);
      expect(res.body.files.signature).toMatch(/^signature-\d+\.jpeg$/);
    });

    it('accepts png', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/upload')
        .attach('signature', createTestBuffer('image/png'), 'photo.png');
      expect(res.status).toBe(200);
      expect(res.body.files.signature).toMatch(/^signature-\d+\.png$/);
    });

    it('accepts webp', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/upload')
        .attach('signature', createTestBuffer('image/webp'), 'photo.webp');
      expect(res.status).toBe(200);
      expect(res.body.files.signature).toMatch(/^signature-\d+\.webp$/);
    });
  });

  describe('reject non-image types', () => {
    it('rejects pdf', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/upload')
        .attach('signature', Buffer.from('%PDF-'), 'doc.pdf');
      expect(res.status).toBe(400);
    });

    it('rejects exe', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/upload')
        .attach('signature', Buffer.from('MZ'), 'virus.exe');
      expect(res.status).toBe(400);
    });

    it('rejects txt', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/upload')
        .attach('signature', Buffer.from('hello'), 'notes.txt');
      expect(res.status).toBe(400);
    });

    it('rejects zip', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/upload')
        .attach('signature', Buffer.from('PK'), 'archive.zip');
      expect(res.status).toBe(400);
    });
  });

  describe('file size limit', () => {
    it('rejects files over 2MB', async () => {
      const app = createApp();
      const bigBuffer = Buffer.alloc(3 * 1024 * 1024);
      const res = await request(app)
        .post('/upload')
        .attach('signature', bigBuffer, 'large.jpg');
      expect(res.status).toBe(400);
    });

    it('accepts files under 2MB', async () => {
      const app = createApp();
      const smallBuffer = Buffer.alloc(1024);
      const res = await request(app)
        .post('/upload')
        .attach('signature', smallBuffer, 'small.jpg');
      expect(res.status).toBe(200);
    });
  });

  describe('filename generation', () => {
    it('generates unique filename with correct prefix and extension', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/upload')
        .attach('signature', createTestBuffer('image/png'), 'custom-name.png');
      expect(res.status).toBe(200);
      expect(res.body.files.signature).toMatch(/^signature-\d+\.png$/);
    });
  });

  describe('destination folder', () => {
    it('writes files to the uploads directory', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/upload')
        .attach('seal', createTestBuffer('image/png'), 'seal.png');
      expect(res.status).toBe(200);
      const filename = res.body.files.seal;
      expect(fs.existsSync(path.join(uploadsDir, filename))).toBe(true);
    });
  });

  describe('multer errors', () => {
    it('handles unexpected field', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/upload')
        .attach('unexpectedField', createTestBuffer('image/png'), 'photo.png');
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Unexpected field');
    });

    it('handles missing file gracefully', async () => {
      const app = createApp();
      const res = await request(app).post('/upload').field('name', 'test');
      expect(res.status).toBe(200);
      expect(res.body.files).toEqual({});
    });

    it('handles both fields simultaneously', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/upload')
        .attach('signature', createTestBuffer('image/png'), 'sig.png')
        .attach('seal', createTestBuffer('image/jpeg'), 'seal.jpg');
      expect(res.status).toBe(200);
      expect(res.body.files.signature).toMatch(/^signature-/);
      expect(res.body.files.seal).toMatch(/^seal-/);
    });

    it('handles single field upload', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/upload')
        .attach('signature', createTestBuffer('image/png'), 'sig.png');
      expect(res.status).toBe(200);
      expect(res.body.files.signature).toBeTruthy();
    });
  });
});
