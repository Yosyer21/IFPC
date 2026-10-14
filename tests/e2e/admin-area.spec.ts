import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('admin@ifpc.com');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

test('Admin: control center and management pages', async ({ page }) => {
  await loginAsAdmin(page);

  // 1. Control center
  await page.goto(`${BASE}/dashboard/admin`);
  await expect(page.getByText('Platform control centre').first()).toBeVisible();
  await expect(page.getByText('Users by role').first()).toBeVisible();
  await expect(page.getByText('Pending actions').first()).toBeVisible();
  await expect(page.getByText('Recent activity').first()).toBeVisible();
  await expect(page.getByText('Recent revenue')).toBeVisible();

  // 2. Management pages
  for (const [url, heading] of [
    ['/dashboard/admin/users', 'Users'],
    ['/dashboard/admin/players', 'Players'],
    ['/dashboard/admin/clubs', 'Clubs'],
    ['/dashboard/admin/opportunities', 'Opportunities'],
    ['/dashboard/admin/memberships', 'Memberships'],
    ['/dashboard/admin/recruitment', 'Recruitment'],
  ] as const) {
    await page.goto(`${BASE}${url}`);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
});
