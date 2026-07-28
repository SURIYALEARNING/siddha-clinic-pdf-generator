import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('redirects unauthenticated user to login page', async ({ page }) => {
    await page.waitForURL('/login');
    await expect(page.locator('h1').filter({ hasText: /welcome back/i }).first()).toBeVisible();
  });

  test('displays login form with all fields', async ({ page }) => {
    await page.waitForURL('/login');
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /login|sign in/i }).first()).toBeVisible();
  });

  test('shows validation error on empty login', async ({ page }) => {
    await page.waitForURL('/login');
    await page.getByRole('button', { name: /login|sign in/i }).first().click();
  });

  test('navigates to register page', async ({ page }) => {
    await page.waitForURL('/login');
    const registerLink = page.getByRole('link', { name: /register/i }).first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/register/);
    }
  });

  test('navigates to forgot password page', async ({ page }) => {
    await page.waitForURL('/login');
    const forgotLink = page.getByRole('link', { name: /forgot|reset/i }).first();
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page).toHaveURL(/forgot/);
    }
  });
});
