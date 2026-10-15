import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('shows the login page and rejects incorrect credentials', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

    await page.fill('input[name="email"]', 'nadie@test.com');
    await page.fill('input[name="password"]', 'wrong-password');
    // La página tiene dos formularios (Google y email): hay que apuntar al botón
    // de credenciales por su texto, no al primer `button[type="submit"]`.
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Incorrect credentials. Please try again.')).toBeVisible();
  });

  test('redirects to login when accessing the dashboard without a session', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
