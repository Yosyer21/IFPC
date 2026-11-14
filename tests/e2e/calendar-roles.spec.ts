import { test, expect, type Page } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 20_000 });
}

const ROLES = [
  {
    label: 'Player',
    email: 'player@demo.com',
    password: 'player123',
    path: '/dashboard/player/calendar',
    title: 'My calendar',
  },
  {
    label: 'Club',
    email: 'club@demo.com',
    password: 'club123',
    path: '/dashboard/calendar',
    title: 'Calendar',
  },
  {
    label: 'Coach',
    email: 'coach@demo.com',
    password: 'coach123',
    path: '/dashboard/calendar',
    title: 'Calendar',
  },
  {
    label: 'Parent',
    email: 'parent@demo.com',
    password: 'parent123',
    path: '/dashboard/calendar',
    title: 'Calendar',
  },
] as const;

/**
 * El calendario rediseñado es el mismo para todos los perfiles: rejilla con
 * fichas, detalle del día, «Next up», «This month», leyenda y navegación de mes.
 */
for (const role of ROLES) {
  test(`${role.label}: calendario rediseñado con su propia ruta`, async ({ page }) => {
    await login(page, role.email, role.password);
    await page.goto(`${BASE}${role.path}`);

    await expect(page.getByRole('heading', { name: role.title, level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Month navigation' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Today' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Next up' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'This month' })).toBeVisible();

    // La navegación de mes conserva la ruta del rol (no salta a otro perfil).
    await page.getByRole('link', { name: 'Next month' }).click();
    await page.waitForURL((url) => url.pathname === role.path && url.searchParams.has('month'), {
      timeout: 15_000,
    });
  });
}

test('Parent: el calendario se adapta al móvil sin desbordes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'parent@demo.com', 'parent123');
  await page.goto(`${BASE}/dashboard/calendar`);

  await expect(page.getByRole('navigation', { name: 'Month navigation' })).toBeVisible();
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
});
