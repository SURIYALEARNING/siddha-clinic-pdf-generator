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

const mockLogin = vi.fn();
const mockClearError = vi.fn();
const mockAddToast = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

import { LoginPage } from '../LoginPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      login: mockLogin,
      clearError: mockClearError,
    });
  });

  it('renders login form with email and password fields', () => {
    renderPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows loading spinner when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      error: null,
      login: mockLogin,
      clearError: mockClearError,
    });
    const { container } = renderPage();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects to /dashboard when user is already authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { name: 'Test' },
      loading: false,
      error: null,
      login: mockLogin,
      clearError: mockClearError,
    });
    renderPage();
    expect(screen.getByText(/redirect to \/dashboard/i)).toBeInTheDocument();
  });

  it('shows error message from auth context', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: 'Invalid credentials',
      login: mockLogin,
      clearError: mockClearError,
    });
    renderPage();
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    mockLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123', true);
    });
    expect(mockAddToast).toHaveBeenCalledWith('Logged in successfully', 'success');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('handles login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Login failed'));
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('toggle password visibility', async () => {
    const user = userEvent.setup();
    renderPage();
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    const toggleButton = passwordInput.parentElement!.querySelector('button')!;
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('submit button shows spinner text while submitting', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/signing in/i)).toBeInTheDocument();
  });

  it('has link to register page and forgot password page', () => {
    renderPage();
    expect(screen.getByText(/register/i).closest('a')).toHaveAttribute('href', '/register');
    expect(screen.getByText(/forgot password/i).closest('a')).toHaveAttribute('href', '/forgot-password');
  });

  it('clearError is called on form submit', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/password/i), 'pass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  it('remember me checkbox can be toggled', async () => {
    const user = userEvent.setup();
    renderPage();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
