import cron from 'node-cron';
import { Draft } from '../models/Draft';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function startDraftCleanupJob(): void {
  cron.schedule('0 0 * * *', async () => {
    const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);
    try {
      const result = await Draft.deleteMany({
        isDeleted: true,
        deletedAt: { $lte: cutoff },
      });
      if (result.deletedCount > 0) {
        console.log(`[cleanup] Permanently deleted ${result.deletedCount} draft(s) soft-deleted before ${cutoff.toISOString()}`);
      }
    } catch (err) {
      console.error('[cleanup] Error deleting expired drafts:', err);
    }
  });
}
