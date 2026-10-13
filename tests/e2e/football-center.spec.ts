import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function login(
  page: import('@playwright/test').Page,
  email: string,
  password: string
) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

/**
 * Football Center del jugador: tres pestañas (cursos, ejercicios y progreso) y,
 * dentro de cada una, el contenido separado por origen (general, coach y club).
 */
test('Football Center: pestañas, orígenes y progreso', async ({ page }) => {
  await login(page, 'player@demo.com', 'player123');
  await page.goto(`${BASE}/dashboard/player/training`);

  // Las tres pestañas.
  await expect(page.getByRole('button', { name: 'Courses' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exercises' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'My progress' })).toBeVisible();

  // Cursos: general + los de su coach y su club.
  await expect(page.getByRole('heading', { name: 'General' })).toBeVisible();
  await expect(page.getByText('Control and first touch').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'From your coach' })).toBeVisible();
  await expect(page.getByText('Scanning before receiving').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'From your club' })).toBeVisible();
  await expect(page.getByText('Club playing model').first()).toBeVisible();

  // Ejercicios con los mismos tres orígenes.
  await page.getByRole('button', { name: 'Exercises' }).click();
  await expect(page.getByText('Cone dribbling circuit').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'From your coach' })).toBeVisible();
  await expect(page.getByText('Third-man runs').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'From your club' })).toBeVisible();
  await expect(page.getByText('Rondo 6v2 with transition').first()).toBeVisible();

  // Marcar un ejercicio como completado (idempotente: acaba siempre completado).
  await page.getByRole('link', { name: 'Cone dribbling circuit' }).first().click();
  await page.waitForURL('**/dashboard/player/training/tc-gen-ex-1');
  if ((await page.getByRole('button', { name: 'Mark as pending' }).count()) === 0) {
    await page.getByRole('button', { name: 'Mark as completed' }).click();
  }
  await expect(page.getByRole('button', { name: 'Mark as pending' })).toBeVisible();

  // Y aparece en el progreso.
  await page.goto(`${BASE}/dashboard/player/training`);
  await page.getByRole('button', { name: 'My progress' }).click();
  await expect(page.getByText('Cone dribbling circuit').first()).toBeVisible();
  await expect(page.getByText('Exercises completed').first()).toBeVisible();
});

/** El coach publica un ejercicio para sus jugadores y puede borrarlo. */
test('Football Center: el coach publica y borra un ejercicio', async ({ page }) => {
  await login(page, 'coach@demo.com', 'coach123');
  await page.goto(`${BASE}/dashboard/coach/training`);
  await expect(page.getByRole('heading', { name: 'Football Center' })).toBeVisible();

  await page.getByRole('button', { name: 'My exercises' }).click();
  const title = `E2E drill ${Date.now()}`;

  await page.getByLabel('Title', { exact: true }).fill(title);
  await page.getByLabel('Short description').fill('Exercise published by the e2e test.');
  await page.getByRole('button', { name: 'Publish' }).click();
  await page.waitForURL('**/dashboard/coach/training', { timeout: 15_000 });

  await page.getByRole('button', { name: 'My exercises' }).click();
  const card = page.locator('.card-hover', { hasText: title }).first();
  await expect(card).toBeVisible();

  // Limpieza: el propio test borra lo que ha creado.
  await card.getByRole('button', { name: 'Delete' }).click();
  await page.waitForURL('**/dashboard/coach/training', { timeout: 15_000 });
  await page.getByRole('button', { name: 'My exercises' }).click();
  await expect(page.getByText(title)).toHaveCount(0);
});
