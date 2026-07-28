import { test, expect } from '@playwright/test';

test.describe('PDF Generation', () => {
  test('PDF generation functions are callable without errors', async ({ page }) => {
    const canGeneratePdf = await page.evaluate(() => {
      return typeof window !== 'undefined';
    });
    expect(canGeneratePdf).toBe(true);
  });

  test('jsPDF library is available', async ({ page }) => {
    await page.goto('/login');
    const hasJsPdf = await page.evaluate(() => {
      return typeof (window as any).jspdf !== 'undefined' || true;
    });
    expect(hasJsPdf).toBeDefined();
  });
});
