import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

/**
 * Abre la lista del Football Center del coach con una **navegación fresca**:
 * después de una server action, el router de dev puede servir la versión cacheada
 * de la lista (en producción `revalidatePath` la invalida).
 */
async function openCoachCenter(page: import('@playwright/test').Page, tab = 'My exercises') {
  await page.goto(`${BASE}/dashboard/coach/training`);
  await page.getByRole('button', { name: tab }).click();
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
  await openCoachCenter(page);
  await expect(page.getByRole('heading', { name: 'Football Center' })).toBeVisible();

  const title = `E2E drill ${Date.now()}`;
  await page.getByLabel('Title', { exact: true }).fill(title);
  await page.getByLabel('Short description').fill('Exercise published by the e2e test.');
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Save content' }).click(),
  ]);
  await page.waitForURL('**/dashboard/coach/training', { timeout: 15_000 });

  await openCoachCenter(page);
  const card = page.locator('.card-hover', { hasText: title }).first();
  await expect(card).toBeVisible();

  // Limpieza: el propio test borra lo que ha creado.
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    card.getByRole('button', { name: 'Delete' }).click(),
  ]);
  await page.waitForURL('**/dashboard/coach/training', { timeout: 15_000 });
  await openCoachCenter(page);
  await expect(page.getByText(title)).toHaveCount(0);
});

/** PNG 1x1 válido, para probar la subida de portada sin ficheros en el repo. */
const PIXEL_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';

/**
 * Autoría v2: el coach edita su contenido, le pone un quiz y sube una portada
 * desde la propia página de edición.
 */
test('Football Center: el coach edita, pone quiz y sube portada', async ({ page }) => {
  await login(page, 'coach@demo.com', 'coach123');
  await openCoachCenter(page);

  // 1. Publica un ejercicio de trabajo (la pestaña fija el tipo).
  const title = `E2E edit ${Date.now()}`;
  await page.getByLabel('Title', { exact: true }).fill(title);
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Save content' }).click(),
  ]);
  await page.waitForURL('**/dashboard/coach/training', { timeout: 15_000 });

  // 2. Lo edita desde la tarjeta (enlace Edit de la rejilla).
  await openCoachCenter(page);
  const created = page.locator('.card-hover', { hasText: title }).first();
  await expect(created).toBeVisible();
  await created.getByRole('link', { name: 'Edit', exact: true }).click();
  await page.waitForURL('**/edit', { timeout: 15_000 });

  const newTitle = `${title} v2`;
  await page.getByLabel('Title', { exact: true }).fill(newTitle);
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Save changes' }).click(),
  ]);
  await page.waitForURL('**/dashboard/coach/training', { timeout: 15_000 });

  await openCoachCenter(page);
  const updated = page.locator('.card-hover', { hasText: newTitle }).first();
  await expect(updated).toBeVisible();

  // 3. Quiz (mismo formato que el builder del admin).
  await updated.getByRole('link', { name: 'Edit', exact: true }).click();
  await page.waitForURL('**/edit', { timeout: 15_000 });
  const editUrl = page.url();

  await page.getByLabel('Questions').fill('Which surface? | Inside | Head');
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Create quiz' }).click(),
  ]);
  await page.goto(editUrl);
  await expect(page.getByRole('button', { name: 'Replace quiz' })).toBeVisible();

  // 4. Portada subida desde la propia página.
  await page.setInputFiles('input[aria-label="Cover image"]', {
    name: 'cover.png',
    mimeType: 'image/png',
    buffer: Buffer.from(PIXEL_PNG, 'base64'),
  });
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Save cover' }).click(),
  ]);
  await page.goto(editUrl);
  await expect(page.getByRole('button', { name: 'Remove cover' })).toBeVisible();

  // 5. Limpieza: el test borra lo que ha creado.
  await openCoachCenter(page);
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page
      .locator('.card-hover', { hasText: newTitle })
      .first()
      .getByRole('button', { name: 'Delete' })
      .click(),
  ]);
  await page.waitForURL('**/dashboard/coach/training', { timeout: 15_000 });
  await openCoachCenter(page);
  await expect(page.getByText(newTitle)).toHaveCount(0);
});

/**
 * Borradores y publicación: lo que está en borrador **no** le llega al jugador, y
 * al publicarlo aparece en su Football Center con su aviso en la bandeja.
 */
test('Football Center: el borrador no llega al jugador hasta publicarlo', async ({
  page,
  browser,
}) => {
  await login(page, 'coach@demo.com', 'coach123');
  await openCoachCenter(page);

  // 1. El coach guarda un ejercicio como borrador.
  const title = `E2E draft ${Date.now()}`;
  await page.getByLabel('Title', { exact: true }).fill(title);
  await page.getByLabel('Who can see it').selectOption('DRAFT');
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Save content' }).click(),
  ]);
  await page.waitForURL('**/dashboard/coach/training', { timeout: 15_000 });

  // 2. La tarjeta se marca como borrador.
  await openCoachCenter(page);
  const card = page.locator('.card-hover', { hasText: title }).first();
  await expect(card).toBeVisible();
  await expect(card.getByText('Draft', { exact: true })).toBeVisible();

  // 3. El jugador todavía no lo ve.
  const hidden = await browser.newContext();
  const hiddenPage = await hidden.newPage();
  await login(hiddenPage, 'player@demo.com', 'player123');
  await hiddenPage.goto(`${BASE}/dashboard/player/training`);
  await hiddenPage.getByRole('button', { name: 'Exercises' }).click();
  await expect(hiddenPage.getByText(title)).toHaveCount(0);
  await hidden.close();

  // 4. El coach lo publica desde la tarjeta.
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    card.getByRole('button', { name: 'Publish now' }).click(),
  ]);
  await page.waitForURL('**/dashboard/coach/training', { timeout: 15_000 });

  // 5. Ahora el jugador lo ve y le ha llegado el aviso.
  const seen = await browser.newContext();
  const seenPage = await seen.newPage();
  await login(seenPage, 'player@demo.com', 'player123');
  await seenPage.goto(`${BASE}/dashboard/player/training`);
  await seenPage.getByRole('button', { name: 'Exercises' }).click();
  await expect(seenPage.getByText(title).first()).toBeVisible();
  await seenPage.goto(`${BASE}/dashboard/player/notifications`);
  await expect(seenPage.getByText('New training from your coach').first()).toBeVisible();
  await expect(seenPage.getByText(title).first()).toBeVisible();
  await seen.close();

  // 6. Limpieza: el test borra lo que ha creado.
  await openCoachCenter(page);
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page
      .locator('.card-hover', { hasText: title })
      .first()
      .getByRole('button', { name: 'Delete' })
      .click(),
  ]);
  await page.waitForURL('**/dashboard/coach/training', { timeout: 15_000 });
});
