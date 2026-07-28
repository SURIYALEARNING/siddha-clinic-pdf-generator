import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mockForgotPassword = vi.fn();
const mockVerifyOtpAndResetPassword = vi.fn();
const mockAddToast = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

import { ForgotPasswordPage } from '../ForgotPasswordPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      forgotPassword: mockForgotPassword,
      verifyOtpAndResetPassword: mockVerifyOtpAndResetPassword,
      loading: false,
    });
  });

  it('renders email input form initially', () => {
    renderPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send otp/i })).toBeInTheDocument();
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  it('shows loading state when authLoading is true', () => {
    mockUseAuth.mockReturnValue({
      forgotPassword: mockForgotPassword,
      verifyOtpAndResetPassword: mockVerifyOtpAndResetPassword,
      loading: true,
    });
    const { container } = renderPage();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('handles send OTP success', async () => {
    mockForgotPassword.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.click(screen.getByRole('button', { name: /send otp/i }));
    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith('test@test.com');
    });
    expect(mockAddToast).toHaveBeenCalledWith('OTP sent to your email', 'success');
    expect(screen.getByText(/verify otp/i)).toBeInTheDocument();
  });

  it('handles send OTP failure with Error', async () => {
    mockForgotPassword.mockRejectedValue(new Error('Email not found'));
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/email/i), 'bad@test.com');
    await user.click(screen.getByRole('button', { name: /send otp/i }));
    await waitFor(() => {
      expect(screen.getByText('Email not found')).toBeInTheDocument();
    });
  });

  it('handles send OTP failure without Error', async () => {
    mockForgotPassword.mockRejectedValue('some error');
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/email/i), 'bad@test.com');
    await user.click(screen.getByRole('button', { name: /send otp/i }));
    await waitFor(() => {
      expect(screen.getByText('Failed to send OTP')).toBeInTheDocument();
    });
  });

  it('OTP step renders OTP and new password fields', async () => {
    mockForgotPassword.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.click(screen.getByRole('button', { name: /send otp/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/otp code/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('OTP validation shows error when OTP is not 6 digits', async () => {
    mockForgotPassword.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.click(screen.getByRole('button', { name: /send otp/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/otp code/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/otp code/i), '123');
    await user.type(screen.getByLabelText(/new password/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    expect(screen.getByText('OTP must be 6 digits')).toBeInTheDocument();
  });

  it('password validation shows error when password < 6 chars', async () => {
    mockForgotPassword.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.click(screen.getByRole('button', { name: /send otp/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/otp code/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/otp code/i), '123456');
    await user.type(screen.getByLabelText(/new password/i), '123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
  });

  it('handles reset success', async () => {
    mockForgotPassword.mockResolvedValue(undefined);
    mockVerifyOtpAndResetPassword.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.click(screen.getByRole('button', { name: /send otp/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/otp code/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/otp code/i), '123456');
    await user.type(screen.getByLabelText(/new password/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => {
      expect(mockVerifyOtpAndResetPassword).toHaveBeenCalledWith('test@test.com', '123456', 'newpass123');
    });
    expect(mockAddToast).toHaveBeenCalledWith('Password reset successfully', 'success');
    expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument();
  });

  it('handles reset failure', async () => {
    mockForgotPassword.mockResolvedValue(undefined);
    mockVerifyOtpAndResetPassword.mockRejectedValue(new Error('Invalid or expired OTP'));
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.click(screen.getByRole('button', { name: /send otp/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/otp code/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/otp code/i), '000000');
    await user.type(screen.getByLabelText(/new password/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => {
      expect(screen.getByText('Invalid or expired OTP')).toBeInTheDocument();
    });
  });

  it('handles reset failure with non-Error rejection', async () => {
    mockForgotPassword.mockResolvedValue(undefined);
    mockVerifyOtpAndResetPassword.mockRejectedValue('some string error');
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.click(screen.getByRole('button', { name: /send otp/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/otp code/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/otp code/i), '123456');
    await user.type(screen.getByLabelText(/new password/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => {
      expect(screen.getByText('Failed to reset password')).toBeInTheDocument();
    });
  });

  it('done step shows success message and sign in link', async () => {
    mockForgotPassword.mockResolvedValue(undefined);
    mockVerifyOtpAndResetPassword.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.click(screen.getByRole('button', { name: /send otp/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/otp code/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/otp code/i), '123456');
    await user.type(screen.getByLabelText(/new password/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => {
      expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/new password/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });

  it('link to login page works', () => {
    renderPage();
    expect(screen.getByText(/back to login/i).closest('a')).toHaveAttribute('href', '/login');
  });

  it('submit button shows spinner during submission for email step', async () => {
    mockForgotPassword.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.click(screen.getByRole('button', { name: /send otp/i }));
    expect(await screen.findByText(/sending otp/i)).toBeInTheDocument();
  });

  it('submit button shows spinner during submission for otp step', async () => {
    mockForgotPassword.mockResolvedValue(undefined);
    mockVerifyOtpAndResetPassword.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.click(screen.getByRole('button', { name: /send otp/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/otp code/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/otp code/i), '123456');
    await user.type(screen.getByLabelText(/new password/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    expect(await screen.findByText(/resetting/i)).toBeInTheDocument();
  });
});
