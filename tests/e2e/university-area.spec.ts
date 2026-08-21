import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function loginAsUniversity(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('university@demo.com');
  await page.getByLabel('Contraseña').fill('university123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

test('Universidad: portal académico-deportivo y páginas de reclutamiento', async ({ page }) => {
  await loginAsUniversity(page);

  // 1. Portada universitaria
  await page.goto(`${BASE}/dashboard/university`);
  await expect(page.getByText('Reclutamiento universitario')).toBeVisible();
  await expect(page.getByText('Jugadores disponibles').first()).toBeVisible();
  await expect(page.getByText('Oportunidades destacadas')).toBeVisible();
  await expect(page.getByText(/Universidad Demo/).first()).toBeVisible();

  // 2. Páginas
  await page.goto(`${BASE}/dashboard/university/players`);
  await expect(page.getByRole('heading', { name: 'Jugadores disponibles' })).toBeVisible();
  await page.goto(`${BASE}/dashboard/university/opportunities`);
  await expect(page.getByRole('heading', { name: 'Oportunidades' })).toBeVisible();
  await expect(page.getByText('Beca deportiva para delanteros')).toBeVisible();
  await page.goto(`${BASE}/dashboard/university/profile`);
  await expect(page.getByRole('heading', { name: 'Mi universidad' })).toBeVisible();
});
