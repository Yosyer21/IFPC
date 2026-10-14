import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

async function loginAsClub(page: import('@playwright/test').Page) {
  await login(page, 'club@demo.com', 'club123');
}

test('Club: centro de reclutamiento y bandeja de requests', async ({ page }) => {
  await loginAsClub(page);

  // 1. Dashboard: centro de reclutamiento
  await page.goto(`${BASE}/dashboard/club`);
  await expect(page.getByText('Recruitment centre').first()).toBeVisible();
  await expect(page.getByText('Pipeline de reclutamiento')).toBeVisible();
  await expect(page.getByText('Applications by status').first()).toBeVisible();
  await expect(page.getByText('Active requirements').first()).toBeVisible();
  await expect(page.getByText('Pending actions').first()).toBeVisible();
  await expect(page.getByText('Recent activity').first()).toBeVisible();

  // 2. Sidebar with the new Applications section
  await page.getByRole('button', { name: 'Recruitment' }).click();
  await expect(page.getByRole('link', { name: 'Applications', exact: true })).toBeVisible();

  // 3. Bandeja de requests
  await page.goto(`${BASE}/dashboard/club/applications`);
  await expect(page.getByRole('heading', { name: 'Applications received' })).toBeVisible();
  await expect(page.getByText(/Demo Player/).first()).toBeVisible();
});

test('Club: ve y entra a las sesiones que organizan sus coaches', async ({ page, browser }) => {
  // 1. El coach programa una sesión de club (la visibilidad por defecto) para mañana.
  await login(page, 'coach@demo.com', 'coach123');
  await page.goto(`${BASE}/dashboard/coach/live-sessions`);

  const title = `E2E club live ${Date.now()}`;
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const startsAt = [
    tomorrow.getFullYear(),
    String(tomorrow.getMonth() + 1).padStart(2, '0'),
    String(tomorrow.getDate()).padStart(2, '0'),
  ].join('-');

  await page.getByLabel('Title *').fill(title);
  await page.getByLabel('Starts *').fill(`${startsAt}T18:00`);
  await page.getByLabel('Meeting link').fill('https://example.com/e2e-club-room');
  await page.getByRole('button', { name: 'Schedule' }).click();
  await page.waitForURL('**/dashboard/coach/live-sessions', { timeout: 15_000 });
  await expect(page.getByText(title)).toBeVisible();

  // 2. Al club le aparece en «Sessions you can join» y entra desde ahí.
  const context = await browser.newContext();
  const clubPage = await context.newPage();
  await login(clubPage, 'club@demo.com', 'club123');

  await clubPage.goto(`${BASE}/dashboard/club/live-sessions`);
  await expect(clubPage.getByText('Sessions you can join')).toBeVisible();

  const card = clubPage.locator('a').filter({ hasText: title }).first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.click();

  // 3. La sesión se abre para el club (misma vista compartida) y puede entrar.
  await clubPage.waitForURL('**/dashboard/live-sessions/**', { timeout: 15_000 });
  await expect(clubPage.getByRole('heading', { name: title })).toBeVisible();
  await expect(clubPage.getByRole('link', { name: 'Join the session' })).toHaveAttribute(
    'href',
    'https://example.com/e2e-club-room'
  );

  // 4. Y el jugador que entrena ese coach también la tiene en su lista.
  const playerPage = await context.newPage();
  await login(playerPage, 'player@demo.com', 'player123');
  await playerPage.goto(`${BASE}/dashboard/player/live-sessions`);
  await expect(playerPage.getByText(title)).toBeVisible({ timeout: 15_000 });

  await context.close();
});
