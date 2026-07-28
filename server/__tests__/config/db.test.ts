import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockConnect = vi.fn();

vi.mock('mongoose', () => ({
  default: { connect: mockConnect },
  connect: mockConnect,
}));

describe('Database config', () => {
  const originalExit = process.exit;

  beforeEach(() => {
    mockConnect.mockReset();
    process.exit = vi.fn() as any;
    process.env.MONGODB_URI = 'mongodb://test:27017/testdb';
  });

  afterEach(() => {
    process.exit = originalExit;
  });

  it('connects successfully with valid URI', async () => {
    mockConnect.mockResolvedValue(undefined);
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { connectDB } = await import('../../config/db');
    await connectDB();
    expect(mockConnect).toHaveBeenCalledWith('mongodb://test:27017/testdb');
    expect(consoleLog).toHaveBeenCalledWith('MongoDB connected');
    consoleLog.mockRestore();
  });

  it('exits process when MONGODB_URI is not set', async () => {
    delete process.env.MONGODB_URI;
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { connectDB } = await import('../../config/db');
    await connectDB();
    expect(consoleError).toHaveBeenCalledWith('MONGODB_URI is not defined in environment');
    expect(process.exit).toHaveBeenCalledWith(1);
    consoleError.mockRestore();
  });

  it('exits process on connection failure', async () => {
    mockConnect.mockRejectedValue(new Error('Connection refused'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { connectDB } = await import('../../config/db');
    await connectDB();
    expect(consoleError).toHaveBeenCalledWith('MongoDB connection error:', expect.any(Error));
    expect(process.exit).toHaveBeenCalledWith(1);
    consoleError.mockRestore();
  });

  it('logs the connection error message', async () => {
    const dbError = new Error('Authentication failed');
    mockConnect.mockRejectedValue(dbError);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { connectDB } = await import('../../config/db');
    await connectDB();
    expect(consoleError).toHaveBeenCalledWith('MongoDB connection error:', dbError);
    consoleError.mockRestore();
  });
});
