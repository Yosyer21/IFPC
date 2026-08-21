import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function loginAsScout(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('scout@demo.com');
  await page.getByLabel('Contraseña').fill('scout123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

test('Scout: puesto de scouting y páginas del radar', async ({ page }) => {
  await loginAsScout(page);

  // 1. Dashboard del scout
  await page.goto(`${BASE}/dashboard/scout`);
  await expect(page.getByText('Proceso de scouting')).toBeVisible();
  await expect(page.getByText('Distribución de valoraciones').first()).toBeVisible();
  await expect(page.getByText('Guardados sin informe').first()).toBeVisible();
  await expect(page.getByText('Mi radar').first()).toBeVisible();
  await expect(page.getByText('Informes recientes').first()).toBeVisible();

  // 2. Páginas principales del scout
  await page.goto(`${BASE}/dashboard/scout/players`);
  await expect(page.getByRole('heading', { name: 'Buscar jugadores' })).toBeVisible();
  await page.goto(`${BASE}/dashboard/scout/saved`);
  await expect(page.getByRole('heading', { name: 'Jugadores guardados' })).toBeVisible();
  await page.goto(`${BASE}/dashboard/scout/scouting-reports`);
  await expect(page.getByRole('heading', { name: 'Informes de scouting' })).toBeVisible();
  await page.goto(`${BASE}/dashboard/scout/opportunities`);
  await expect(page.getByRole('heading', { name: 'Oportunidades' })).toBeVisible();
});
