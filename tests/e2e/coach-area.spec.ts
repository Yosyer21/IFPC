import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

test('Coach: asigna evaluación y objetivo al jugador, y el jugador los ve', async ({ page }) => {
  // 1. Login como entrenador
  await login(page, 'coach@demo.com', 'coach123');

  // 2. Dashboard del coach rediseñado (hero, radar, donut, actividad)
  await page.goto(`${BASE}/dashboard/coach`);
  await expect(page.getByRole('heading', { name: /Buenos días|Buenas tardes|Buenas noches/ })).toBeVisible();
  await expect(page.getByText('Nivel medio por categoría')).toBeVisible();
  await expect(page.getByText('Media global del grupo')).toBeVisible();
  await expect(page.getByText('Actividad reciente')).toBeVisible();
  await expect(page.getByText('Jugador Demo').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Registrar evaluación' }).first()).toBeVisible();

  // 3. Entrar al jugador y crear un objetivo
  await page.goto(`${BASE}/dashboard/coach/players`);
  await page.getByRole('link', { name: /Jugador Demo/ }).click();
  await page.getByRole('link', { name: 'Ver objetivos y crear' }).click();

  const goalTitle = `Objetivo E2E ${Date.now()}: mejor golpeo`;
  await page.getByLabel('Título del objetivo').fill(goalTitle);
  await page.getByLabel('Fecha límite').fill('2026-12-31');
  await page.getByLabel('Descripción').fill('Registrar 50 remates por semana en el entrenamiento.');
  await page.getByRole('button', { name: 'Crear objetivo' }).click();
  await page.waitForURL('**/development', { timeout: 15_000 });
  await expect(page.getByText(goalTitle)).toBeVisible();

  // 4. Crear una evaluación
  await page.goto(`${BASE}/dashboard/coach/players`);
  await page.getByRole('link', { name: /Jugador Demo/ }).first().click();
  await page.getByRole('link', { name: 'Ver evaluaciones y registrar' }).click();

  await page.getByLabel('Puntuación (1-10)').fill('9');
  const evalNotes = `Evaluación E2E ${Date.now()}: gran evolución en el primer toque.`;
  await page.getByLabel('Notas').fill(evalNotes);
  await page.getByRole('button', { name: 'Registrar evaluación' }).click();
  await page.waitForURL('**/evaluations', { timeout: 15_000 });
  await expect(page.getByText(evalNotes)).toBeVisible();

  // 5. El jugador ve el objetivo y la evaluación en su área
  const playerContext = await page.context().newPage();
  await login(playerContext, 'player@demo.com', 'player123');
  await playerContext.goto(`${BASE}/dashboard/player/development/goals`);
  await expect(playerContext.getByText(goalTitle)).toBeVisible();
  await playerContext.goto(`${BASE}/dashboard/player/development/evaluations`);
  await expect(playerContext.getByText(evalNotes)).toBeVisible();
  await expect(playerContext.getByText('por Entrenador Demo').first()).toBeVisible();
  await playerContext.close();
});
