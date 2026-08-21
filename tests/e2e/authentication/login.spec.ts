import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  test('muestra la página de login y rechaza credenciales incorrectas', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();

    await page.fill('input[name="email"]', 'nadie@test.com');
    await page.fill('input[name="password"]', 'contraseña-incorrecta');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Credenciales incorrectas')).toBeVisible();
  });

  test('redirige al login cuando se accede al dashboard sin sesión', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
