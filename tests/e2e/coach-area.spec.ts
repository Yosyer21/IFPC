import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

test('Coach: assigns assessment and goal to the player, and the player sees them', async ({ page }) => {
  // 1. Login como entrenador
  await login(page, 'coach@demo.com', 'coach123');

  // 2. Redesigned coach dashboard (hero, radar, donut, activity)
  await page.goto(`${BASE}/dashboard/coach`);
  await expect(page.getByRole('heading', { name: /Good morning|Good afternoon|Good evening/ })).toBeVisible();
  await expect(page.getByText('Average level by category')).toBeVisible();
  await expect(page.getByText('Group overall average')).toBeVisible();
  await expect(page.getByText('Recent activity')).toBeVisible();
  await expect(page.getByText('Jugador Demo').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Register assessment' }).first()).toBeVisible();

  // 3. Entrar al jugador y crear un objetivo
  await page.goto(`${BASE}/dashboard/coach/players`);
  await page.getByRole('link', { name: /Jugador Demo/ }).click();
  await page.getByRole('link', { name: 'Ver objetivos y crear' }).click();

  const goalTitle = `Objetivo E2E ${Date.now()}: mejor golpeo`;
  await page.getByLabel('Goal title').fill(goalTitle);
  await page.getByLabel('Deadline').fill('2026-12-31');
  await page.getByLabel('Description').fill('Registrar 50 remates por semana en el entrenamiento.');
  await page.getByRole('button', { name: 'Crear objetivo' }).click();
  await page.waitForURL('**/development', { timeout: 15_000 });
  await expect(page.getByText(goalTitle)).toBeVisible();

  // 4. Create an assessment
  await page.goto(`${BASE}/dashboard/coach/players`);
  await page.getByRole('link', { name: /Jugador Demo/ }).first().click();
  await page.getByRole('link', { name: 'Ver evaluaciones y registrar' }).click();

  await page.getByLabel('Score (1-10)').fill('9');
  const evalNotes = `E2E assessment ${Date.now()}: great progress on first touch.`;
  await page.getByLabel('Notas').fill(evalNotes);
  await page.getByRole('button', { name: 'Register assessment' }).click();
  await page.waitForURL('**/evaluations', { timeout: 15_000 });
  await expect(page.getByText(evalNotes)).toBeVisible();

  // 5. The player sees the goal and the assessment in their area
  const playerContext = await page.context().newPage();
  await login(playerContext, 'player@demo.com', 'player123');
  await playerContext.goto(`${BASE}/dashboard/player/development/goals`);
  await expect(playerContext.getByText(goalTitle)).toBeVisible();
  await playerContext.goto(`${BASE}/dashboard/player/development/evaluations`);
  await expect(playerContext.getByText(evalNotes)).toBeVisible();
  await expect(playerContext.getByText('por Entrenador Demo').first()).toBeVisible();
  await playerContext.close();
});
