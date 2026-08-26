import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function loginAsScout(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('scout@demo.com');
  await page.getByLabel('Password').fill('scout123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

test('Scout: scouting station and radar pages', async ({ page }) => {
  await loginAsScout(page);

  // 1. Dashboard del scout
  await page.goto(`${BASE}/dashboard/scout`);
  await expect(page.getByText('Scouting process')).toBeVisible();
  await expect(page.getByText('Ratings distribution').first()).toBeVisible();
  await expect(page.getByText('Saved without report').first()).toBeVisible();
  await expect(page.getByText('My radar').first()).toBeVisible();
  await expect(page.getByText('Recent reports').first()).toBeVisible();

  // 2. Main scout pages
  await page.goto(`${BASE}/dashboard/scout/players`);
  await expect(page.getByRole('heading', { name: 'Search players' })).toBeVisible();
  await page.goto(`${BASE}/dashboard/scout/saved`);
  await expect(page.getByRole('heading', { name: 'Jugadores guardados' })).toBeVisible();
  await page.goto(`${BASE}/dashboard/scout/scouting-reports`);
  await expect(page.getByRole('heading', { name: 'Informes de scouting' })).toBeVisible();
  await page.goto(`${BASE}/dashboard/scout/opportunities`);
  await expect(page.getByRole('heading', { name: 'Oportunidades' })).toBeVisible();
});
