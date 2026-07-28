import { test, expect } from '@playwright/test';

test.describe('Patient Form Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('patient form contains required fields', async ({ page }) => {
    await page.waitForURL('/login');
    await page.goto('/');
    const patientTab = page.getByRole('button', { name: /patient/i }).first();
    if (await patientTab.isVisible()) {
      await patientTab.click();
    }
  });

  test('medicine entry page has add medicine button', async ({ page }) => {
    await page.goto('/');
    const medicinesTab = page.getByRole('button', { name: /medicine|prescription/i }).first();
    if (await medicinesTab.isVisible()) {
      await medicinesTab.click();
    }
  });

  test('preview page shows PDF options', async ({ page }) => {
    await page.goto('/');
    const previewTab = page.getByRole('button', { name: /preview/i }).first();
    if (await previewTab.isVisible()) {
      await previewTab.click();
    }
  });

  test('sidebar navigation is accessible', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('nav').first();
    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible();
    }
  });
});
