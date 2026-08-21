import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('admin@futurebuller.com');
  await page.getByLabel('Contraseña').fill('admin123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

test('Admin: centro de control y páginas de gestión', async ({ page }) => {
  await loginAsAdmin(page);

  // 1. Centro de control
  await page.goto(`${BASE}/dashboard/admin`);
  await expect(page.getByText('Centro de control').first()).toBeVisible();
  await expect(page.getByText('Usuarios por rol').first()).toBeVisible();
  await expect(page.getByText('Acciones pendientes').first()).toBeVisible();
  await expect(page.getByText('Actividad reciente').first()).toBeVisible();
  await expect(page.getByText('Ingresos recientes')).toBeVisible();

  // 2. Páginas de gestión
  for (const [url, heading] of [
    ['/dashboard/admin/users', 'Usuarios'],
    ['/dashboard/admin/players', 'Jugadores'],
    ['/dashboard/admin/clubs', 'Clubes'],
    ['/dashboard/admin/opportunities', 'Oportunidades'],
    ['/dashboard/admin/memberships', 'Membresías'],
    ['/dashboard/admin/recruitment', 'Reclutamiento'],
  ] as const) {
    await page.goto(`${BASE}${url}`);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
});
