import '@testing-library/jest-dom';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }),
  },
});

// Mock HTMLCanvasElement to avoid "Not implemented" warnings in jsdom
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (() => {
    const mockCtx = {
      fillStyle: '', strokeStyle: '', lineWidth: 1, lineCap: '', lineJoin: '',
      font: '', textAlign: 'start' as CanvasTextAlign,
      fillRect: () => {}, fillText: () => {}, beginPath: () => {},
      closePath: () => {}, moveTo: () => {}, lineTo: () => {},
      arc: () => {}, quadraticCurveTo: () => {}, bezierCurveTo: () => {},
      stroke: () => {}, fill: () => {}, rect: () => {},
      measureText: () => ({ width: 10 }),
      getImageData: () => ({ data: [] }),
      putImageData: () => {},
      createImageData: () => ([]),
      drawImage: () => {},
      scale: () => {}, rotate: () => {}, translate: () => {},
      restore: () => {}, save: () => {},
      clearRect: () => {}, strokeRect: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      createPattern: () => null,
      setTransform: () => {},
      transform: () => {},
      clip: () => {},
      isPointInPath: () => false,
      canvas: {} as HTMLCanvasElement,
      globalAlpha: 1, globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
      imageSmoothingEnabled: true,
      shadowBlur: 0, shadowColor: '', shadowOffsetX: 0, shadowOffsetY: 0,
      getTransform: () => new DOMMatrix(),
      filter: '',
      msImageSmoothingEnabled: true,
      imageSmoothingQuality: 'low' as ImageSmoothingQuality,
    } as unknown as CanvasRenderingContext2D;
    return () => mockCtx;
  })();

  HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,mock';
}
