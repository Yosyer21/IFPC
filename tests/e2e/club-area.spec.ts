import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function loginAsClub(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('club@demo.com');
  await page.getByLabel('Contraseña').fill('club123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

test('Club: centro de reclutamiento y bandeja de solicitudes', async ({ page }) => {
  await loginAsClub(page);

  // 1. Dashboard: centro de reclutamiento
  await page.goto(`${BASE}/dashboard/club`);
  await expect(page.getByText('Centro de reclutamiento').first()).toBeVisible();
  await expect(page.getByText('Pipeline de reclutamiento')).toBeVisible();
  await expect(page.getByText('Solicitudes por estado').first()).toBeVisible();
  await expect(page.getByText('Requisitos activos').first()).toBeVisible();
  await expect(page.getByText('Acciones pendientes').first()).toBeVisible();
  await expect(page.getByText('Actividad reciente').first()).toBeVisible();

  // 2. Sidebar con la nueva sección Solicitudes
  await page.getByRole('button', { name: 'Reclutamiento' }).click();
  await expect(page.getByRole('link', { name: 'Solicitudes', exact: true })).toBeVisible();

  // 3. Bandeja de solicitudes
  await page.goto(`${BASE}/dashboard/club/applications`);
  await expect(page.getByRole('heading', { name: 'Solicitudes recibidas' })).toBeVisible();
  await expect(page.getByText(/Jugador Demo/).first()).toBeVisible();
});
