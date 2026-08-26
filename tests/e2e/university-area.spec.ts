import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function loginAsUniversity(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('university@demo.com');
  await page.getByLabel('Password').fill('university123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

test('University: academic-sports portal and recruitment pages', async ({ page }) => {
  await loginAsUniversity(page);

  // 1. Portada universitaria
  await page.goto(`${BASE}/dashboard/university`);
  await expect(page.getByText('University recruitment')).toBeVisible();
  await expect(page.getByText('Available players').first()).toBeVisible();
  await expect(page.getByText('Featured opportunities')).toBeVisible();
  await expect(page.getByText(/Universidad Demo/).first()).toBeVisible();

  // 2. Pages
  await page.goto(`${BASE}/dashboard/university/players`);
  await expect(page.getByRole('heading', { name: 'Available players' })).toBeVisible();
  await page.goto(`${BASE}/dashboard/university/opportunities`);
  await expect(page.getByRole('heading', { name: 'Oportunidades' })).toBeVisible();
  await expect(page.getByText('Beca deportiva para delanteros')).toBeVisible();
  await page.goto(`${BASE}/dashboard/university/profile`);
  await expect(page.getByRole('heading', { name: 'Mi universidad' })).toBeVisible();
});
