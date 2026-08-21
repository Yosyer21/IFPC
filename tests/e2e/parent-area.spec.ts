import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function loginAsParent(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('parent@demo.com');
  await page.getByLabel('Contraseña').fill('parent123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

test('Familiar: hub familiar, hijo vinculado y páginas de apoyo', async ({ page }) => {
  await loginAsParent(page);

  // 1. Hub familiar
  await page.goto(`${BASE}/dashboard/parent`);
  await expect(page.getByText('Hub familiar').first()).toBeVisible();
  await expect(page.getByText('Nivel de tu hijo por categoría')).toBeVisible();
  await expect(page.getByText('Mis hijos').first()).toBeVisible();
  await expect(page.getByText('Actividad reciente')).toBeVisible();
  await expect(page.getByText('Tus pagos')).toBeVisible();

  // 2. Mis hijos → detalle del hijo
  await page.goto(`${BASE}/dashboard/parent/children`);
  await expect(page.getByRole('heading', { name: 'Mis hijos' })).toBeVisible();
  await page.getByRole('link', { name: /Jugador Demo/ }).click();
  await expect(page.getByRole('heading', { name: /Jugador Demo/ })).toBeVisible();

  // 3. Educación, oportunidades y pagos
  await page.goto(`${BASE}/dashboard/parent/education`);
  await expect(page.getByRole('heading', { name: 'Educación para familias' })).toBeVisible();
  await page.goto(`${BASE}/dashboard/parent/opportunities`);
  await expect(page.getByRole('heading', { name: 'Oportunidades' })).toBeVisible();
  await page.goto(`${BASE}/dashboard/parent/payments`);
  await expect(page.getByRole('heading', { name: 'Pagos' })).toBeVisible();
  await expect(page.getByText('Membresía familiar')).toBeVisible();
});
