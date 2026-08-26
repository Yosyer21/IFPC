import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function loginAsClub(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('club@demo.com');
  await page.getByLabel('Password').fill('club123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

test('Club: centro de reclutamiento y bandeja de solicitudes', async ({ page }) => {
  await loginAsClub(page);

  // 1. Dashboard: centro de reclutamiento
  await page.goto(`${BASE}/dashboard/club`);
  await expect(page.getByText('Centro de reclutamiento').first()).toBeVisible();
  await expect(page.getByText('Pipeline de reclutamiento')).toBeVisible();
  await expect(page.getByText('Applications by status').first()).toBeVisible();
  await expect(page.getByText('Active requirements').first()).toBeVisible();
  await expect(page.getByText('Pending actions').first()).toBeVisible();
  await expect(page.getByText('Recent activity').first()).toBeVisible();

  // 2. Sidebar with the new Applications section
  await page.getByRole('button', { name: 'Reclutamiento' }).click();
  await expect(page.getByRole('link', { name: 'Applications', exact: true })).toBeVisible();

  // 3. Bandeja de solicitudes
  await page.goto(`${BASE}/dashboard/club/applications`);
  await expect(page.getByRole('heading', { name: 'Applications recibidas' })).toBeVisible();
  await expect(page.getByText(/Jugador Demo/).first()).toBeVisible();
});
