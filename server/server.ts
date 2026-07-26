import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'ADMIN_EMAIL', 'EMAIL_USER', 'EMAIL_PASS'];
for (const v of requiredEnvVars) {
  if (!process.env[v]) {
    console.error(`Missing required environment variable: ${v}`);
    process.exit(1);
  }
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { connectDB } from './config/db';
import authRoutes from './routes/auth';
import doctorRoutes from './routes/doctor';
import draftRoutes from './routes/draft';
import settingsRoutes from './routes/settings';

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

app.set('trust proxy', 1);

app.use(helmet());

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login/register attempts, please try again later' },
});

app.use(express.json({ limit: '5mb' }));
app.use(mongoSanitize());
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 2MB)' : err.message });
    return;
  }
  if (err.message === 'Only image files are allowed') {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err.type === 'entity.too.large') {
    res.status(413).json({ error: 'Request body too large' });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
