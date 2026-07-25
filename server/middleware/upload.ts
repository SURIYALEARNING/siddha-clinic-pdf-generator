import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(__dirname, '..', 'uploads', 'doctors'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.fieldname + '-' + Date.now() + ext;
    cb(null, name);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const uploadDoctorImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).fields([
  { name: 'signature', maxCount: 1 },
  { name: 'seal', maxCount: 1 },
]);
