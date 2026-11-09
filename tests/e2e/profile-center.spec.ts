import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function loginAsPlayer(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('player@demo.com');
  await page.getByLabel('Password').fill('player123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

/**
 * Profile center: una sola entrada en el sidebar agrupa perfil, Player ID y
 * desarrollo, con tabs que son enlaces reales (URL propia por sección).
 */
test('Profile center: agrupa My profile, Player ID y My development', async ({ page }) => {
  await loginAsPlayer(page);
  await page.goto(`${BASE}/dashboard/player`);

  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await nav.getByRole('link', { name: 'Profile center' }).click();
  await page.waitForURL('**/dashboard/player/profile-center/profile');

  // Marco común del hub con la primera sección debajo.
  await expect(page.getByRole('heading', { name: 'Profile center', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Profile strength' })).toBeVisible();

  // Player ID
  await page.getByRole('link', { name: 'Player ID', exact: true }).click();
  await page.waitForURL('**/dashboard/player/profile-center/id');
  await expect(page.getByRole('heading', { name: 'Player ID' })).toBeVisible();

  // My development
  await page.getByRole('link', { name: 'My development', exact: true }).click();
  await page.waitForURL('**/dashboard/player/profile-center/development');
  await expect(page.getByRole('heading', { name: 'My development' })).toBeVisible();

  // Vuelta al perfil
  await page.getByRole('link', { name: 'My profile', exact: true }).click();
  await page.waitForURL('**/dashboard/player/profile-center/profile');
  await expect(page.getByRole('heading', { name: 'Profile strength' })).toBeVisible();

  // El sidebar mantiene Profile center como sección activa.
  await expect(nav.getByRole('link', { name: 'Profile center' })).toHaveAttribute(
    'aria-current',
    'page'
  );
});
