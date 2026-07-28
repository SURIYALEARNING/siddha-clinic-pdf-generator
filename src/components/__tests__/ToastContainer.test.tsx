import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastContainer } from '../ToastContainer';

const mockRemoveToast = vi.fn();
vi.mock('../../context/ToastContext', () => ({
  useToast: vi.fn(),
}));
import { useToast } from '../../context/ToastContext';

describe('ToastContainer', () => {
  it('returns null when toasts array is empty', () => {
    (useToast as any).mockReturnValue({ toasts: [], removeToast: mockRemoveToast });
    const { container } = render(<ToastContainer />);
    expect(container.innerHTML).toBe('');
  });

  it('renders success toasts', () => {
    (useToast as any).mockReturnValue({
      toasts: [{ id: '1', type: 'success', message: 'Success!' }],
      removeToast: mockRemoveToast,
    });
    render(<ToastContainer />);
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders error toasts', () => {
    (useToast as any).mockReturnValue({
      toasts: [{ id: '1', type: 'error', message: 'Error!' }],
      removeToast: mockRemoveToast,
    });
    render(<ToastContainer />);
    expect(screen.getByText('Error!')).toBeInTheDocument();
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('renders info toasts', () => {
    (useToast as any).mockReturnValue({
      toasts: [{ id: '1', type: 'info', message: 'Info message' }],
      removeToast: mockRemoveToast,
    });
    render(<ToastContainer />);
    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    (useToast as any).mockReturnValue({
      toasts: [
        { id: '1', type: 'success', message: 'First' },
        { id: '2', type: 'error', message: 'Second' },
      ],
      removeToast: mockRemoveToast,
    });
    render(<ToastContainer />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('calls removeToast when dismiss button clicked', () => {
    (useToast as any).mockReturnValue({
      toasts: [{ id: '1', type: 'info', message: 'Dismiss me' }],
      removeToast: mockRemoveToast,
    });
    render(<ToastContainer />);
    fireEvent.click(screen.getByText('×'));
    expect(mockRemoveToast).toHaveBeenCalledWith('1');
  });
});
