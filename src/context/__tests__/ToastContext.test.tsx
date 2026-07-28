import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, renderHook } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastContext';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ToastContext', () => {
  it('provides initial empty toasts array', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastProvider });
    expect(result.current.toasts).toEqual([]);
  });

  it('adds a toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastProvider });
    act(() => {
      result.current.addToast('Success message', 'success');
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Success message');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('removes a toast after 4 seconds', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastProvider });
    act(() => {
      result.current.addToast('Auto dismiss', 'info');
    });
    expect(result.current.toasts).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('removes a specific toast by id', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastProvider });
    act(() => {
      result.current.addToast('Toast 1', 'success');
      result.current.addToast('Toast 2', 'error');
    });
    expect(result.current.toasts).toHaveLength(2);
    act(() => {
      result.current.removeToast(result.current.toasts[0].id);
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Toast 2');
  });

  it('supports success, error, and info types', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastProvider });
    act(() => {
      result.current.addToast('Success', 'success');
      result.current.addToast('Error', 'error');
      result.current.addToast('Info', 'info');
    });
    expect(result.current.toasts.map((t) => t.type)).toEqual(['success', 'error', 'info']);
  });

  it('falls back to timestamp-based ID when crypto is unavailable', () => {
    vi.stubGlobal('crypto', undefined);
    const { result } = renderHook(() => useToast(), { wrapper: ToastProvider });
    act(() => {
      result.current.addToast('Fallback ID', 'info');
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].id).toBeTruthy();
    vi.unstubAllGlobals();
  });

  it('throws error when useToast is used outside provider', () => {
    expect(() => renderHook(() => useToast())).toThrow('useToast must be used within a ToastProvider');
  });

  it('renders toasts in the DOM via ToastContainer', () => {
    render(
      <ToastProvider>
        <ToastConsumer />
      </ToastProvider>,
    );
  });
});

function ToastConsumer() {
  const { addToast } = useToast();
  return <button onClick={() => addToast('Clicked!', 'success')}>Show Toast</button>;
}
