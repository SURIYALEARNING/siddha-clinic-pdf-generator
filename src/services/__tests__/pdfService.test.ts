import { describe, it, expect } from 'vitest';

describe('pdfService barrel exports', () => {
  it('exports generateAnnexurePdf', async () => {
    const mod = await import('../pdfService');
    expect(typeof mod.generateAnnexurePdf).toBe('function');
  });

  it('exports generateCashBillPdf', async () => {
    const mod = await import('../pdfService');
    expect(typeof mod.generateCashBillPdf).toBe('function');
  });

  it('exports generateToWhomsoeverPdf', async () => {
    const mod = await import('../pdfService');
    expect(typeof mod.generateToWhomsoeverPdf).toBe('function');
  });

  it('exports generateTreatmentBillPdf', async () => {
    const mod = await import('../pdfService');
    expect(typeof mod.generateTreatmentBillPdf).toBe('function');
  });
});
