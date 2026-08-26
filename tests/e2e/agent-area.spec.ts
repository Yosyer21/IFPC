import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function loginAsAgent(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('agent@demo.com');
  await page.getByLabel('Password').fill('agent123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

test('Agent: workspace, pipeline and new pages without 404', async ({ page }) => {
  await loginAsAgent(page);

  // 1. Dashboard del agente
  await page.goto(`${BASE}/dashboard/agent`);
  await expect(page.getByText('Representation pipeline')).toBeVisible();
  await expect(page.getByText('Submissions by stage')).toBeVisible();
  await expect(page.getByText('Pending actions').first()).toBeVisible();
  await expect(page.getByText('My players').first()).toBeVisible();
  await expect(page.getByText('Recent activity')).toBeVisible();

  // 2. Sidebar with Submissions (renamed)
  await page.getByRole('button', { name: 'Reclutamiento' }).click();
  await expect(
    page.locator('aside').getByRole('link', { name: 'Submissions', exact: true }).first()
  ).toBeVisible();

  // 3. New pages: Trials, Negotiations, Contracts, Clubs (no 404)
  for (const [url, heading] of [
    ['/dashboard/agent/trials', 'Pruebas'],
    ['/dashboard/agent/negotiations', 'Negociaciones'],
    ['/dashboard/agent/contracts', 'Contratos'],
    ['/dashboard/agent/clubs', 'Clubes'],
  ] as const) {
    await page.goto(`${BASE}${url}`);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
});
