import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function loginAsParent(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('parent@demo.com');
  await page.getByLabel('Password').fill('parent123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

test('Parent: family hub, linked child and support pages', async ({ page }) => {
  await loginAsParent(page);

  // 1. Hub familiar
  await page.goto(`${BASE}/dashboard/parent`);
  await expect(page.getByText('Hub familiar').first()).toBeVisible();
  await expect(page.getByText('Your child's level by category')).toBeVisible();
  await expect(page.getByText('My children').first()).toBeVisible();
  await expect(page.getByText('Recent activity')).toBeVisible();
  await expect(page.getByText('Your payments')).toBeVisible();

  // 2. My children → detalle del hijo
  await page.goto(`${BASE}/dashboard/parent/children`);
  await expect(page.getByRole('heading', { name: 'My children' })).toBeVisible();
  await page.getByRole('link', { name: /Jugador Demo/ }).click();
  await expect(page.getByRole('heading', { name: /Jugador Demo/ })).toBeVisible();

  // 3. Education, opportunities and payments
  await page.goto(`${BASE}/dashboard/parent/education`);
  await expect(page.getByRole('heading', { name: 'Education for families' })).toBeVisible();
  await page.goto(`${BASE}/dashboard/parent/opportunities`);
  await expect(page.getByRole('heading', { name: 'Oportunidades' })).toBeVisible();
  await page.goto(`${BASE}/dashboard/parent/payments`);
  await expect(page.getByRole('heading', { name: 'Payments' })).toBeVisible();
  await expect(page.getByText('Family membership')).toBeVisible();
});
