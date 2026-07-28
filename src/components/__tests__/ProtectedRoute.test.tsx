import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProtectedRoute', () => {
  it('shows loading spinner when auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    render(
      <MemoryRouter>
        <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects to /login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1', name: 'Test', email: 'test@test.com' }, loading: false });
    render(
      <MemoryRouter>
        <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
