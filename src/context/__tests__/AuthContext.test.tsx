import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

const mockApi = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  verifyRegistrationOtp: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  getMe: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  api: mockApi,
}));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

function setup() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider });
}

describe('AuthContext', () => {
  it('starts with no user when no token', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('checks stored token on mount', async () => {
    localStorage.setItem('lhcc_token', 'valid-token');
    mockApi.getMe.mockResolvedValue({ data: { user: { id: '1', name: 'Test', email: 'test@test.com' } } });
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.name).toBe('Test');
  });

  it('clears invalid token on mount', async () => {
    localStorage.setItem('lhcc_token', 'invalid-token');
    mockApi.getMe.mockResolvedValue({ error: 'Invalid token' });
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('lhcc_token')).toBeNull();
  });

  it('login sets user and token on success', async () => {
    mockApi.login.mockResolvedValue({ data: { token: 'abc', user: { id: '1', name: 'Test', email: 'test@test.com' } } });
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.login('test@test.com', 'password', false);
    });
    expect(result.current.user?.name).toBe('Test');
    expect(localStorage.getItem('lhcc_token')).toBe('abc');
  });

  it('login sets error on failure', async () => {
    mockApi.login.mockResolvedValue({ error: 'Invalid credentials' });
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      try { await result.current.login('test@test.com', 'wrong', false); } catch {}
    });
    expect(result.current.error).toBe('Invalid credentials');
  });

  it('logout clears user and token', async () => {
    localStorage.setItem('lhcc_token', 'abc');
    mockApi.getMe.mockResolvedValue({ data: { user: { id: '1', name: 'Test', email: 'test@test.com' } } });
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => { result.current.logout(); });
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('lhcc_token')).toBeNull();
  });

  it('register calls API and returns message', async () => {
    mockApi.register.mockResolvedValue({ data: { message: 'OTP sent to admin email' } });
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    let msg;
    await act(async () => {
      msg = await result.current.register('Test', 'test@test.com', 'password123');
    });
    expect(msg.message).toContain('OTP');
  });

  it('verifyRegistrationOtp sets token and user', async () => {
    mockApi.verifyRegistrationOtp.mockResolvedValue({ data: { token: 'abc', user: { id: '1', name: 'Test', email: 'test@test.com' } } });
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.verifyRegistrationOtp('Test', 'test@test.com', 'pass', '123456');
    });
    expect(result.current.user?.email).toBe('test@test.com');
  });

  it('forgotPassword calls API', async () => {
    mockApi.forgotPassword.mockResolvedValue({ data: { message: 'OTP sent' } });
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.forgotPassword('test@test.com');
    });
    expect(mockApi.forgotPassword).toHaveBeenCalledWith('test@test.com');
  });

  it('verifyOtpAndResetPassword calls API', async () => {
    mockApi.resetPassword.mockResolvedValue({ data: { message: 'Password reset' } });
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.verifyOtpAndResetPassword('test@test.com', '123456', 'newpass');
    });
    expect(mockApi.resetPassword).toHaveBeenCalledWith('test@test.com', '123456', 'newpass');
  });

  it('clearError resets error state', async () => {
    mockApi.login.mockResolvedValue({ error: 'Error' });
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      try { await result.current.login('test@test.com', 'wrong', false); } catch {}
    });
    expect(result.current.error).toBeTruthy();
    act(() => { result.current.clearError(); });
    expect(result.current.error).toBeNull();
  });

  it('throws when useAuth used outside provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
  });

  it('forgotPassword failure sets error state', async () => {
    mockApi.forgotPassword.mockResolvedValue({ error: 'Email not found' });
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      try { await result.current.forgotPassword('nonexistent@test.com'); } catch {}
    });
    expect(result.current.error).toBe('Email not found');
  });

  it('verifyOtpAndResetPassword failure sets error state', async () => {
    mockApi.resetPassword.mockResolvedValue({ error: 'Invalid OTP' });
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      try { await result.current.verifyOtpAndResetPassword('test@test.com', '000000', 'newpass'); } catch {}
    });
    expect(result.current.error).toBe('Invalid OTP');
  });

  it('verifyOtpAndResetPassword success does not set token or user', async () => {
    mockApi.resetPassword.mockResolvedValue({ data: { message: 'Password reset' } });
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.verifyOtpAndResetPassword('test@test.com', '123456', 'newpass');
    });
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('lhcc_token')).toBeNull();
  });

  it('register failure sets error state', async () => {
    mockApi.register.mockResolvedValue({ error: 'Email already registered' });
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      try { await result.current.register('Test', 'existing@test.com', 'password'); } catch {}
    });
    expect(result.current.error).toBe('Email already registered');
  });

  it('verifyRegistrationOtp failure sets error state', async () => {
    mockApi.verifyRegistrationOtp.mockResolvedValue({ error: 'Invalid OTP' });
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      try { await result.current.verifyRegistrationOtp('Test', 'test@test.com', 'pass', '000000'); } catch {}
    });
    expect(result.current.error).toBe('Invalid OTP');
  });

  it('login does not set user or token when res.data is missing', async () => {
    mockApi.login.mockResolvedValue({ data: null });
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.login('test@test.com', 'password', false);
    });
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('lhcc_token')).toBeNull();
  });

  it('register returns default message when API does not provide one', async () => {
    mockApi.register.mockResolvedValue({ data: {} });
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    let msg;
    await act(async () => {
      msg = await result.current.register('Test', 'test@test.com', 'password123');
    });
    expect(msg.message).toBe('OTP sent to admin email');
  });

  it('verifyRegistrationOtp does not set token when res.data is missing', async () => {
    mockApi.verifyRegistrationOtp.mockResolvedValue({ data: null });
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.verifyRegistrationOtp('Test', 'test@test.com', 'pass', '123456');
    });
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('lhcc_token')).toBeNull();
  });
});
