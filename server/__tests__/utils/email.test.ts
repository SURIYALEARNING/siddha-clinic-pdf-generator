import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockSendMail = vi.fn();
const mockCreateTransport = vi.fn(() => ({ sendMail: mockSendMail }));

vi.mock('nodemailer', () => ({
  default: { createTransport: mockCreateTransport },
  createTransport: mockCreateTransport,
}));

describe('Email utility', () => {
  beforeEach(() => {
    vi.resetModules();
    mockSendMail.mockReset();
    mockCreateTransport.mockReset();
    process.env.EMAIL_USER = 'test@gmail.com';
    process.env.EMAIL_PASS = 'app-password';
  });

  it('creates transporter with correct config', async () => {
    await import('../../utils/email');
    expect(mockCreateTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: {
        user: 'test@gmail.com',
        pass: 'app-password',
      },
    });
  });

  it('sends registration OTP email successfully', async () => {
    mockSendMail.mockResolvedValue({ accepted: ['admin@test.com'] });
    const { sendOtpEmail } = await import('../../utils/email');
    await sendOtpEmail('admin@test.com', '123456', 'registration');
    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'test@gmail.com',
      to: 'admin@test.com',
      subject: 'New Registration OTP - LHCC',
      text: expect.stringContaining('123456'),
    });
  });

  it('sends forgot-password OTP email successfully', async () => {
    mockSendMail.mockResolvedValue({ accepted: ['user@test.com'] });
    const { sendOtpEmail } = await import('../../utils/email');
    await sendOtpEmail('user@test.com', '654321', 'forgot-password');
    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'test@gmail.com',
      to: 'user@test.com',
      subject: 'Password Reset OTP - LHCC',
      text: expect.stringContaining('654321'),
    });
  });

  it('uses correct subject for registration OTP', async () => {
    mockSendMail.mockResolvedValue({});
    const { sendOtpEmail } = await import('../../utils/email');
    await sendOtpEmail('admin@test.com', '123456', 'registration');
    const call = mockSendMail.mock.calls[0][0];
    expect(call.subject).toBe('New Registration OTP - LHCC');
  });

  it('uses correct subject for forgot-password OTP', async () => {
    mockSendMail.mockResolvedValue({});
    const { sendOtpEmail } = await import('../../utils/email');
    await sendOtpEmail('user@test.com', '654321', 'forgot-password');
    const call = mockSendMail.mock.calls[0][0];
    expect(call.subject).toBe('Password Reset OTP - LHCC');
  });

  it('throws error on SMTP failure', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP connection failed'));
    const { sendOtpEmail } = await import('../../utils/email');
    await expect(sendOtpEmail('admin@test.com', '123456', 'registration')).rejects.toThrow('Failed to send email');
  });

  it('logs error on SMTP failure', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSendMail.mockRejectedValue(new Error('SMTP timeout'));
    const { sendOtpEmail } = await import('../../utils/email');
    await expect(sendOtpEmail('admin@test.com', '123456', 'registration')).rejects.toThrow();
    expect(consoleError).toHaveBeenCalledWith('Failed to send email:', expect.any(Error));
    consoleError.mockRestore();
  });

  it('throws on rejected promise from sendMail', async () => {
    mockSendMail.mockRejectedValue('raw rejection');
    const { sendOtpEmail } = await import('../../utils/email');
    await expect(sendOtpEmail('admin@test.com', '123456', 'registration')).rejects.toThrow('Failed to send email');
  });

  it('sends to correct recipient', async () => {
    mockSendMail.mockResolvedValue({});
    const { sendOtpEmail } = await import('../../utils/email');
    await sendOtpEmail('recipient@example.com', '123456', 'registration');
    expect(mockSendMail.mock.calls[0][0].to).toBe('recipient@example.com');
  });

  it('includes OTP in email body', async () => {
    mockSendMail.mockResolvedValue({});
    const { sendOtpEmail } = await import('../../utils/email');
    await sendOtpEmail('admin@test.com', '999999', 'registration');
    expect(mockSendMail.mock.calls[0][0].text).toContain('999999');
  });
});
