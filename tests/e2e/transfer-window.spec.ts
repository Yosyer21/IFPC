import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function loginAsPlayer(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('player@demo.com');
  await page.getByLabel('Password').fill('player123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

/**
 * Pestaña «Transfer window» dentro de Opportunities: cabecera, contadores,
 * tabs internas y filtros. No se pulsa Accept/Decline a propósito: esas acciones
 * avisan a la familia y cambian datos del seed (ya están cubiertas por tests
 * unitarios de las server actions).
 */
test('Transfer window: hero, counters, inner tabs and filters', async ({ page }) => {
  await loginAsPlayer(page);
  await page.goto(`${BASE}/dashboard/player/opportunities`);

  // Cabecera oscura con la ventana abierta y los tres contadores reales.
  await expect(page.getByRole('heading', { name: /transfer window/i })).toBeVisible();
  await expect(page.getByText('Window open')).toBeVisible();
  await expect(page.getByText('Offers waiting', { exact: true })).toBeVisible();
  await expect(page.getByText('Matches', { exact: true })).toBeVisible();
  await expect(page.getByText('Applications', { exact: true })).toBeVisible();
  await expect(page.getByText('Profile strength:', { exact: false })).toBeVisible();

  // Oferta real del seed: invitación a prueba de Demo Club.
  await expect(page.getByRole('heading', { name: 'Demo Club trial invitation' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Accept: send to parent' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Decline' })).toBeVisible();

  // Tab interna: oportunidades abiertas con su match.
  await page.getByRole('tab', { name: /Open matches/ }).click();
  await expect(page.getByRole('heading', { name: 'U-17 youth trial' })).toBeVisible();

  // Filtros: solo la beca de la universidad.
  await page.getByRole('button', { name: 'University', exact: true }).click();
  await expect(page.getByRole('heading', { name: /University sports scholarship/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'U-17 youth trial' })).toBeHidden();

  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'U-17 youth trial' })).toBeVisible();

  // Tab interna: candidaturas ya enviadas.
  await page.getByRole('tab', { name: /My applications/ }).click();
  await expect(page.getByRole('heading', { name: 'U-17 youth trial' })).toBeVisible();
  await expect(page.getByText(/^Sent (today|yesterday|\d+ days ago)$/)).toBeVisible();

  // La pestaña externa sigue llevando al listado completo de oportunidades.
  await page.getByRole('button', { name: /All opportunities/ }).click();
  await expect(page.getByRole('heading', { name: /University sports scholarship/ })).toBeVisible();
});
