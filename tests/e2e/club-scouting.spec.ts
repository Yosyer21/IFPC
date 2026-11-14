import { test, expect, type Page } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function loginAsClub(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('club@demo.com');
  await page.getByLabel('Password').fill('club123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 20_000 });
}

/** «Find players»: cabecera de scouting, filtros y shortlist real (toggle). */
test('Club: Find players con filtros, stats y shortlist', async ({ page }) => {
  await loginAsClub(page);
  await page.goto(`${BASE}/dashboard/club/players`);

  await expect(page.getByRole('heading', { name: /find players/i, level: 1 })).toBeVisible();
  await expect(
    page.getByText('Verified profiles, real stats and Film Room highlights.')
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Keepers', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'U19+', exact: true })).toBeVisible();
  await expect(page.getByText(/highlight clip/).first()).toBeVisible();

  // Filtro de demarcación: conserva la ruta y el parámetro.
  await page.getByRole('link', { name: 'Forwards', exact: true }).click();
  await page.waitForURL(
    (url) =>
      url.pathname === '/dashboard/club/players' && url.searchParams.get('position') === 'forwards',
    { timeout: 15_000 }
  );

  // Volver a «All» y probar el toggle de shortlist (se deja como estaba).
  await page.getByRole('link', { name: 'All', exact: true }).click();
  const shortlist = page.getByRole('button', { name: 'Shortlist', exact: true });
  await expect(shortlist.first()).toBeVisible();
  await shortlist.first().click();
  await expect(
    page.getByRole('button', { name: 'Shortlisted', exact: true }).first()
  ).toBeVisible();

  await page.getByRole('button', { name: 'Shortlisted', exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Shortlist', exact: true }).first()).toBeVisible();

  // La invitación existe, pero no se pulsa (crearía una prueba real).
  await expect(
    page.getByRole('button', { name: 'Invite to trial', exact: true }).first()
  ).toBeVisible();
});

test('Club: Find players en móvil sin desbordes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAsClub(page);
  await page.goto(`${BASE}/dashboard/club/players`);

  await expect(page.getByRole('heading', { name: /find players/i, level: 1 })).toBeVisible();
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
});
