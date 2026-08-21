import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function loginAsAgent(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('agent@demo.com');
  await page.getByLabel('Contraseña').fill('agent123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

test('Agente: workspace, pipeline y páginas nuevas sin 404', async ({ page }) => {
  await loginAsAgent(page);

  // 1. Dashboard del agente
  await page.goto(`${BASE}/dashboard/agent`);
  await expect(page.getByText('Pipeline de representación')).toBeVisible();
  await expect(page.getByText('Envíos por fase')).toBeVisible();
  await expect(page.getByText('Acciones pendientes').first()).toBeVisible();
  await expect(page.getByText('Mis jugadores').first()).toBeVisible();
  await expect(page.getByText('Actividad reciente')).toBeVisible();

  // 2. Sidebar con Envíos (renombrado)
  await page.getByRole('button', { name: 'Reclutamiento' }).click();
  await expect(
    page.locator('aside').getByRole('link', { name: 'Envíos', exact: true }).first()
  ).toBeVisible();

  // 3. Páginas nuevas: Pruebas, Negociaciones, Contratos, Clubes (sin 404)
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
