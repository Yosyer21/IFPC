import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('shows the login page and rejects incorrect credentials', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

    await page.fill('input[name="email"]', 'nadie@test.com');
    await page.fill('input[name="password"]', 'wrong-password');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Credenciales incorrectas')).toBeVisible();
  });

  test('redirects to login when accessing the dashboard without a session', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
