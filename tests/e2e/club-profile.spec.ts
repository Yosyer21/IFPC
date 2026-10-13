import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function loginAsClub(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('club@demo.com');
  await page.getByLabel('Password').fill('club123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

/**
 * Perfil del club: cabecera personalizable (portada, escudo, headline, chips y
 * acento), panel de actividad, información, checklist y muro de Discovery; y su
 * formulario de edición funcionando de punta a punta.
 */
test('Club: perfil editable con headline, descripción, chips y acento', async ({ page }) => {
  await loginAsClub(page);

  // 1. El perfil muestra las secciones nuevas.
  await page.goto(`${BASE}/dashboard/club/profile`);
  await expect(page.getByRole('heading', { name: 'Demo Club' })).toBeVisible();
  await expect(page.getByText('Club activity').first()).toBeVisible();
  await expect(page.getByText('Club information').first()).toBeVisible();
  await expect(page.getByText('Profile strength').first()).toBeVisible();
  await expect(page.getByText('Manage your club').first()).toBeVisible();

  // 2. Se edita el perfil (mismos valores que el seed: el test es idempotente).
  await page.goto(`${BASE}/dashboard/club/profile/edit`);
  await page.getByLabel('Headline').fill('Youth development club · Madrid');
  await page.getByLabel('About the club').fill(
    'Development club with teams from U12 to U19 and a residential programme for international players.'
  );
  await page.getByLabel('Founded in').fill('1998');
  await page.getByRole('checkbox', { name: 'Open trials' }).check();
  await page.getByTitle('Cyan').click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.waitForURL('**/dashboard/club/profile', { timeout: 15_000 });

  // 3. Los cambios se ven en el perfil del club.
  await expect(page.getByText('Youth development club · Madrid').first()).toBeVisible();
  await expect(page.getByText('Open trials').first()).toBeVisible();
  await expect(page.getByText('Founded 1998').first()).toBeVisible();
  await expect(page.getByText('About the club').first()).toBeVisible();

  // 4. La checklist reconoce lo que falta por completar (escudo y portada).
  await expect(page.getByText('Club crest').first()).toBeVisible();
  await expect(page.getByText('Cover photo').first()).toBeVisible();
});
