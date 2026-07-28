import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDefaultLogo, getDefaultSignature } from '../defaultImages';

function createMockCanvas() {
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
    font: '',
    textAlign: '',
    fillRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ctx),
    toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
  };
  return { canvas, ctx };
}

beforeEach(() => {
  const { canvas, ctx } = createMockCanvas();
  vi.stubGlobal('document', {
    createElement: vi.fn(() => canvas),
  });
  vi.stubGlobal('window', {});
});

describe('getDefaultLogo', () => {
  it('returns a data URI string', () => {
    const result = getDefaultLogo();
    expect(result).toBe('data:image/png;base64,mock');
  });

  it('creates a canvas element', () => {
    getDefaultLogo();
    expect(document.createElement).toHaveBeenCalledWith('canvas');
  });

  it('sets correct canvas dimensions', () => {
    getDefaultLogo();

    const canvas = (document as any).createElement.mock.results[0].value;
    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(100);
  });
});

describe('getDefaultSignature', () => {
  it('returns a data URI string', () => {
    const result = getDefaultSignature();
    expect(result).toBe('data:image/png;base64,mock');
  });

  it('uses provided doctor name', () => {
    getDefaultSignature('Dr. Test');

    const ctx = (document as any).createElement.mock.results[0].value.getContext();
    expect(ctx.fillText).toHaveBeenCalledWith('Dr. Test', 70, 95);
  });

  it('uses default name when none provided', () => {
    getDefaultSignature();

    const ctx = (document as any).createElement.mock.results[0].value.getContext();
    expect(ctx.fillText).toHaveBeenCalledWith('Dr. S. Lakshmi', 70, 95);
  });

  it('sets correct canvas dimensions', () => {
    getDefaultSignature();

    const canvas = (document as any).createElement.mock.results[0].value;
    expect(canvas.width).toBe(300);
    expect(canvas.height).toBe(100);
  });

  it('returns empty string when canvas getContext returns null (getDefaultLogo)', () => {
    const { canvas } = createMockCanvas();
    canvas.getContext = vi.fn(() => null);
    vi.stubGlobal('document', { createElement: vi.fn(() => canvas) });
    vi.stubGlobal('window', {});
    expect(getDefaultLogo()).toBe('');
  });

  it('returns empty string when canvas getContext returns null (getDefaultSignature)', () => {
    const { canvas } = createMockCanvas();
    canvas.getContext = vi.fn(() => null);
    vi.stubGlobal('document', { createElement: vi.fn(() => canvas) });
    vi.stubGlobal('window', {});
    expect(getDefaultSignature('Dr. Test')).toBe('');
  });
});
