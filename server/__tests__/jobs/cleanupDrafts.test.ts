import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

const mockDeleteMany = vi.fn();
let scheduledCb: (() => void) | undefined;

vi.mock('../../models/Draft', () => ({ Draft: { deleteMany: mockDeleteMany } }));
vi.mock('node-cron', () => ({
  default: { schedule: vi.fn((_cron: string, fn: () => void) => { scheduledCb = fn; }) },
  schedule: vi.fn((_cron: string, fn: () => void) => { scheduledCb = fn; }),
}));

describe('cleanupDrafts job', () => {
  beforeAll(async () => {
    const mod = await import('../../jobs/cleanupDrafts');
    mod.startDraftCleanupJob();
  });

  beforeEach(() => {
    mockDeleteMany.mockReset();
  });

  it('schedules a daily cron job', async () => {
    const cron = await import('node-cron');
    expect(cron.default.schedule).toHaveBeenCalledWith('0 0 * * *', expect.any(Function));
  });

  it('calls deleteMany with correct filter', async () => {
    mockDeleteMany.mockResolvedValue({ deletedCount: 5 });
    expect(scheduledCb).toBeTruthy();
    if (scheduledCb) {
      await scheduledCb();
    }
    expect(mockDeleteMany).toHaveBeenCalledOnce();
    const filter = mockDeleteMany.mock.calls[0][0];
    expect(filter.isDeleted).toBe(true);
    expect(filter.deletedAt).toBeDefined();
    expect(filter.deletedAt.$lte).toBeInstanceOf(Date);
  });

  it('logs when drafts are deleted', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockDeleteMany.mockResolvedValue({ deletedCount: 3 });
    if (scheduledCb) {
      await scheduledCb();
    }
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Permanently deleted 3 draft(s)'));
    consoleLog.mockRestore();
  });

  it('does not log when no drafts are deleted', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockDeleteMany.mockResolvedValue({ deletedCount: 0 });
    if (scheduledCb) {
      await scheduledCb();
    }
    expect(consoleLog).not.toHaveBeenCalled();
    consoleLog.mockRestore();
  });

  it('handles deleteMany errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockDeleteMany.mockRejectedValue(new Error('DB connection lost'));
    if (scheduledCb) {
      await scheduledCb();
    }
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Error deleting expired drafts'), expect.any(Error));
    consoleError.mockRestore();
  });

  it('handles promise rejection in deleteMany', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockDeleteMany.mockRejectedValue('Unknown rejection');
    if (scheduledCb) {
      await scheduledCb();
    }
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
