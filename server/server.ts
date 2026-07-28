import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'ADMIN_EMAIL', 'EMAIL_USER', 'EMAIL_PASS'];
for (const v of requiredEnvVars) {
  if (!process.env[v]) {
    console.error(`Missing required environment variable: ${v}`);
    process.exit(1);
  }
}

import { connectDB } from './config/db';
import { startDraftCleanupJob } from './jobs/cleanupDrafts';
import { app, PORT } from './app';

async function start() {
  try {
    await connectDB();

    startDraftCleanupJob();
    console.log('[cleanup] Draft cleanup job scheduled (runs daily at midnight)');

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();

export { app };
