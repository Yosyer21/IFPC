import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function loginAsPlayer(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('player@demo.com');
  await page.getByLabel('Password').fill('player123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

test('Player area: navigation, saving opportunity, status and documents', async ({ page }) => {
  await loginAsPlayer(page);

  // 1. Sidebar con secciones plegables del jugador
  await page.goto(`${BASE}/dashboard/player`);
  // The active section (Main) opens automatically
  await expect(page.getByRole('link', { name: 'Mi desarrollo' })).toBeVisible();
  // The other sections start collapsed and open when clicked
  await page.getByRole('button', { name: 'Contenido' }).click();
  await expect(page.getByRole('link', { name: 'Mis documentos' })).toBeVisible();
  await page.getByRole('button', { name: 'Mi carrera' }).click();
  await expect(page.getByRole('link', { name: 'Oportunidades', exact: true })).toBeVisible();

  // 1b. Redesigned dashboard: hero, chart and dynamic counters
  await expect(page.getByRole('heading', { name: /Good morning|Good afternoon|Good evening/ })).toBeVisible();
  await expect(page.getByText('Level by category')).toBeVisible();
  await expect(page.getByText('Profile complete')).toBeVisible();
  await expect(page.getByText('Recent activity')).toBeVisible();
  await expect(page.getByRole('link', { name: 'View public profile' })).toBeVisible();

  // 2. Guardar / quitar oportunidad
  await page.goto(`${BASE}/dashboard/player/opportunities/opp-club-1`);
  await expect(page.getByRole('heading', { name: 'Prueba para juvenil Sub-17' })).toBeVisible();
  // Viene guardada por seed
  await expect(page.getByRole('button', { name: 'Quitar de guardadas' })).toBeVisible();
  await page.getByRole('button', { name: 'Quitar de guardadas' }).click();
  await expect(page.getByRole('button', { name: 'Guardar oportunidad' })).toBeVisible();
  await page.getByRole('button', { name: 'Guardar oportunidad' }).click();
  await expect(page.getByRole('button', { name: 'Quitar de guardadas' })).toBeVisible();

  // 3. Toggle de disponibilidad
  await page.goto(`${BASE}/dashboard/player/profile`);
  await expect(page.getByRole('button', { name: 'Marcar como no disponible' })).toBeVisible();
  await page.getByRole('button', { name: 'Marcar como no disponible' }).click();
  await expect(page.getByRole('button', { name: 'Marcar como disponible' })).toBeVisible();
  await page.getByRole('button', { name: 'Marcar como disponible' }).click();
  await expect(page.getByRole('button', { name: 'Marcar como no disponible' })).toBeVisible();

  // 4. Subir documento
  await page.goto(`${BASE}/dashboard/player/documents/upload`);
  const docTitle = `Test medical certificate ${Date.now()}`;
  await page.getByLabel('Document title').fill(docTitle);
  await page.getByLabel('Archivo').setInputFiles({
    name: 'test.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 demo document'),
  });
  await page.getByRole('button', { name: 'Subir documento' }).click();
  await page.waitForURL('**/dashboard/player/documents', { timeout: 15_000 });
  await expect(page.getByText(docTitle)).toBeVisible();
});

test('Player area: hamburger menu on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAsPlayer(page);

  await page.goto(`${BASE}/dashboard/player`);
  await page.getByRole('button', { name: 'Open menu' }).click();
  // The drawer shows the navigation
  await expect(page.getByRole('link', { name: 'Mi desarrollo' })).toBeVisible();
  // When navigating, the drawer closes by itself
  await page.getByRole('link', { name: 'Mi desarrollo' }).click();
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close menu' })).toBeHidden();
});
