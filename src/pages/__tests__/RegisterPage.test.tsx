import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: vi.fn(({ to }) => <div>Redirect to {to}</div>),
    useNavigate: () => mockNavigate,
  };
});

const mockRegister = vi.fn();
const mockVerifyOtp = vi.fn();
const mockAddToast = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

import { RegisterPage } from '../RegisterPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      register: mockRegister,
      verifyRegistrationOtp: mockVerifyOtp,
    });
  });

  it('renders registration form with name, email, password, confirm password fields', () => {
    renderPage();
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('shows loading spinner when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      register: mockRegister,
      verifyRegistrationOtp: mockVerifyOtp,
    });
    const { container } = renderPage();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects to /dashboard when user already authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { name: 'Test' },
      loading: false,
      register: mockRegister,
      verifyRegistrationOtp: mockVerifyOtp,
    });
    renderPage();
    expect(screen.getByText(/redirect to \/dashboard/i)).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/^name$/i), 'Test User');
    await user.type(screen.getByLabelText(/^email$/i), 'test@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different');
    await user.click(screen.getByRole('button', { name: /register/i }));
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('shows error when password is less than 6 characters', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/^name$/i), 'Test User');
    await user.type(screen.getByLabelText(/^email$/i), 'test@test.com');
    await user.type(screen.getByLabelText(/^password$/i), '123');
    await user.type(screen.getByLabelText(/confirm password/i), '123');
    await user.click(screen.getByRole('button', { name: /register/i }));
    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
  });

  it('handles successful registration', async () => {
    mockRegister.mockResolvedValue({ message: 'OTP sent' });
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/^name$/i), 'Test User');
    await user.type(screen.getByLabelText(/^email$/i), 'test@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /register/i }));
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('Test User', 'test@test.com', 'password123');
    });
    expect(mockAddToast).toHaveBeenCalledWith('OTP sent to admin email for verification', 'info');
    expect(screen.getByText(/verify otp/i)).toBeInTheDocument();
  });

  it('handles registration failure with Error', async () => {
    mockRegister.mockRejectedValue(new Error('Email already exists'));
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/^name$/i), 'Test User');
    await user.type(screen.getByLabelText(/^email$/i), 'test@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /register/i }));
    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('handles registration failure with generic error', async () => {
    mockRegister.mockRejectedValue('Some string error');
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/^name$/i), 'Test User');
    await user.type(screen.getByLabelText(/^email$/i), 'test@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /register/i }));
    await waitFor(() => {
      expect(screen.getByText('Registration failed')).toBeInTheDocument();
    });
  });

  it('OTP step renders OTP input field', async () => {
    mockRegister.mockResolvedValue({ message: 'OTP sent' });
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/^name$/i), 'Test User');
    await user.type(screen.getByLabelText(/^email$/i), 'test@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /register/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/otp code/i)).toBeInTheDocument();
    });
  });

  it('OTP validation shows error when OTP is not 6 digits', async () => {
    mockRegister.mockResolvedValue({ message: 'OTP sent' });
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/^name$/i), 'Test User');
    await user.type(screen.getByLabelText(/^email$/i), 'test@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /register/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/otp code/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/otp code/i), '123');
    await user.click(screen.getByRole('button', { name: /verify & create account/i }));
    expect(screen.getByText('OTP must be 6 digits')).toBeInTheDocument();
  });

  it('OTP verification success', async () => {
    mockRegister.mockResolvedValue({ message: 'OTP sent' });
    mockVerifyOtp.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/^name$/i), 'Test User');
    await user.type(screen.getByLabelText(/^email$/i), 'test@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /register/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/otp code/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/otp code/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify & create account/i }));
    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith('Test User', 'test@test.com', 'password123', '123456');
    });
    expect(mockAddToast).toHaveBeenCalledWith('Account created successfully', 'success');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('OTP verification failure shows error', async () => {
    mockRegister.mockResolvedValue({ message: 'OTP sent' });
    mockVerifyOtp.mockRejectedValue(new Error('Invalid OTP'));
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/^name$/i), 'Test User');
    await user.type(screen.getByLabelText(/^email$/i), 'test@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /register/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/otp code/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/otp code/i), '000000');
    await user.click(screen.getByRole('button', { name: /verify & create account/i }));
    await waitFor(() => {
      expect(screen.getByText('Invalid OTP')).toBeInTheDocument();
    });
  });

  it('OTP verification failure with non-Error shows generic message', async () => {
    mockRegister.mockResolvedValue({ message: 'OTP sent' });
    mockVerifyOtp.mockRejectedValue('some error');
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/^name$/i), 'Test User');
    await user.type(screen.getByLabelText(/^email$/i), 'test@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /register/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/otp code/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/otp code/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify & create account/i }));
    await waitFor(() => {
      expect(screen.getByText('OTP verification failed')).toBeInTheDocument();
    });
  });

  it('back button returns to form step', async () => {
    mockRegister.mockResolvedValue({ message: 'OTP sent' });
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/^name$/i), 'Test User');
    await user.type(screen.getByLabelText(/^email$/i), 'test@test.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /register/i }));
    await waitFor(() => {
      expect(screen.getByText(/verify otp/i)).toBeInTheDocument();
    });
    await user.click(screen.getByText(/back to registration form/i));
    expect(screen.getByText(/create account/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('toggle password visibility', async () => {
    const user = userEvent.setup();
    renderPage();
    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    const toggleButton = passwordInput.parentElement!.querySelector('button')!;
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
