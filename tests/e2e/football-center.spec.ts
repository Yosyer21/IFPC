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

/**
 * Ejercicio estructurado: el coach arma la ficha (series, reps, descanso, espacio,
 * jugadores y material) y el jugador la ve tal cual en el detalle.
 */
test('Football Center: el coach arma la ficha de un ejercicio', async ({ page, browser }) => {
  await login(page, 'coach@demo.com', 'coach123');
  await openCoachCenter(page);

  // 1. Publica un ejercicio nuevo.
  const title = `E2E sheet ${Date.now()}`;
  await page.getByLabel('Title', { exact: true }).fill(title);
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Save content' }).click(),
  ]);
  await page.waitForURL('**/dashboard/coach/training', { timeout: 15_000 });

  // 2. Lo edita y rellena la ficha de campo.
  await openCoachCenter(page);
  const card = page.locator('.card-hover', { hasText: title }).first();
  await expect(card).toBeVisible();
  await card.getByRole('link', { name: 'Edit', exact: true }).click();
  await page.waitForURL('**/edit', { timeout: 15_000 });
  const editUrl = page.url();

  await page.getByLabel('Series').fill('4');
  await page.getByLabel('Reps or time').fill('4 min');
  await page.getByLabel('Rest (seconds)').fill('90');
  await page.getByLabel('Space').fill('30x20 m');
  await page.getByLabel('Players').fill('4v4 + 2 neutrals');
  await page.getByLabel('Balls').check();
  await page.getByLabel('Cones').check();
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Save changes' }).click(),
  ]);
  await page.waitForURL('**/dashboard/coach/training', { timeout: 15_000 });

  // 3. Al volver a editar, la ficha sigue ahí.
  await page.goto(editUrl);
  await expect(page.getByLabel('Series')).toHaveValue('4');
  await expect(page.getByLabel('Rest (seconds)')).toHaveValue('90');
  await expect(page.getByLabel('Balls')).toBeChecked();

  // 4. El jugador ve la ficha en el detalle del ejercicio.
  const seen = await browser.newContext();
  const seenPage = await seen.newPage();
  await login(seenPage, 'player@demo.com', 'player123');
  await seenPage.goto(`${BASE}/dashboard/player/training`);
  await seenPage.getByRole('button', { name: 'Exercises' }).click();
  await seenPage.getByRole('link', { name: title }).first().click();
  await seenPage.waitForURL('**/dashboard/player/training/**');
  await expect(seenPage.getByRole('heading', { name: 'Exercise sheet' })).toBeVisible();
  await expect(seenPage.getByText('4 × 4 min · rest 1 min 30 s')).toBeVisible();
  await expect(seenPage.getByText('30x20 m')).toBeVisible();
  await expect(seenPage.getByText('4v4 + 2 neutrals')).toBeVisible();
  await expect(seenPage.getByText('Balls', { exact: true })).toBeVisible();
  await seen.close();

  // 5. Limpieza: el test borra lo que ha creado.
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

/**
 * Sesiones (plan semanal): el coach monta una sesión con ejercicios en orden y el
 * jugador la ve en «Weekly plan», con su aviso y su progreso por ejercicio.
 */
test('Football Center: el coach monta una sesión y el jugador la ve', async ({ page, browser }) => {
  await login(page, 'coach@demo.com', 'coach123');

  // 1. Un ejercicio propio y publicado para poder planificarlo.
  await openCoachCenter(page);
  const drillTitle = `E2E session drill ${Date.now()}`;
  await page.getByLabel('Title', { exact: true }).fill(drillTitle);
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Save content' }).click(),
  ]);
  await page.waitForURL('**/dashboard/coach/training', { timeout: 15_000 });

  // 2. Crea la sesión (queda publicada y se abre para montarla).
  await openCoachCenter(page, 'Sessions');
  const title = `E2E session ${Date.now()}`;
  await page.getByLabel('Session title').fill(title);
  await page.getByLabel('Suggested day').selectOption('2');
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Create session' }).click(),
  ]);
  await page.waitForURL('**/edit', { timeout: 15_000 });
  const editUrl = page.url();

  // 3. Dos ejercicios dentro: uno del catálogo de su coach y el que acaba de crear.
  await page.getByLabel('Add exercise').selectOption({ label: 'Third-man runs (4v4+2) · 20 min' });
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Add' }).click(),
  ]);
  await page.goto(editUrl);
  await page.getByLabel('Add exercise').selectOption({ label: drillTitle });
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Add' }).click(),
  ]);
  await page.goto(editUrl);
  await expect(page.getByText('1. Third-man runs (4v4+2)')).toBeVisible();
  await expect(page.getByText(`2. ${drillTitle}`)).toBeVisible();

  // 4. El orden se puede cambiar (el segundo pasa a ser el primero).
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page.getByRole('button', { name: '↑' }).nth(1).click(),
  ]);
  await page.goto(editUrl);
  await expect(page.locator('ol li').first()).toContainText(drillTitle);

  // 5. El jugador la ve en su plan semanal con su progreso y su aviso.
  const seen = await browser.newContext();
  const seenPage = await seen.newPage();
  await login(seenPage, 'player@demo.com', 'player123');
  await seenPage.goto(`${BASE}/dashboard/player/training`);
  await seenPage.getByRole('button', { name: 'Weekly plan' }).click();
  await expect(seenPage.getByRole('heading', { name: 'From your coach' })).toBeVisible();
  await expect(seenPage.getByText('0 of 2 completed').first()).toBeVisible();
  await seenPage.getByRole('link', { name: title }).first().click();
  await seenPage.waitForURL('**/dashboard/player/training/sessions/**');
  await expect(seenPage.getByRole('link', { name: drillTitle }).first()).toBeVisible();

  await seenPage.goto(`${BASE}/dashboard/player/notifications`);
  await expect(seenPage.getByText('New training session from your coach').first()).toBeVisible();
  await seenPage.getByRole('link', { name: title }).first().click();
  await seenPage.waitForURL('**/dashboard/player/training/sessions/**');

  // Marca un ejercicio de la sesión y el progreso del plan lo refleja.
  await seenPage.getByRole('link', { name: drillTitle }).first().click();
  await seenPage.waitForURL('**/dashboard/player/training/**');
  if ((await seenPage.getByRole('button', { name: 'Mark as pending' }).count()) === 0) {
    await seenPage.getByRole('button', { name: 'Mark as completed' }).click();
  }
  await seenPage.goto(`${BASE}/dashboard/player/training`);
  await seenPage.getByRole('button', { name: 'Weekly plan' }).click();
  await expect(seenPage.getByText('1 of 2 completed').first()).toBeVisible();
  await seen.close();

  // 6. Limpieza: el test borra la sesión y el ejercicio que ha creado.
  await openCoachCenter(page, 'Sessions');
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page
      .locator('.card-hover', { hasText: title })
      .first()
      .getByRole('button', { name: 'Delete' })
      .click(),
  ]);
  await page.waitForURL('**/dashboard/coach/training', { timeout: 15_000 });
  await openCoachCenter(page);
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page
      .locator('.card-hover', { hasText: drillTitle })
      .first()
      .getByRole('button', { name: 'Delete' })
      .click(),
  ]);
  await page.waitForURL('**/dashboard/coach/training', { timeout: 15_000 });
});

/**
 * Destinatarios: el coach dirige un ejercicio a un jugador concreto, ve en su panel
 * quién lo ha hecho, le manda un recordatorio y al otro jugador no le llega nada.
 */
test('Football Center: el coach dirige un ejercicio a un jugador', async ({ page, browser }) => {
  await login(page, 'coach@demo.com', 'coach123');
  await openCoachCenter(page);

  // 1. Crea el ejercicio y lo dirige solo al jugador 1.
  const title = `E2E assigned ${Date.now()}`;
  await page.getByLabel('Title', { exact: true }).fill(title);
  await page.getByLabel('Recipients').selectOption('SELECTED');
  await page.getByLabel('Demo Player', { exact: true }).check();
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Save content' }).click(),
  ]);
  await page.waitForURL('**/dashboard/coach/training', { timeout: 15_000 });

  // 2. La tarjeta lo marca y el panel dice quién lo recibe.
  await openCoachCenter(page);
  const card = page.locator('.card-hover', { hasText: title }).first();
  await expect(card.getByText('Only 1 player')).toBeVisible();
  await card.getByRole('link', { name: 'Edit', exact: true }).click();
  await page.waitForURL('**/edit', { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Who has done it' })).toBeVisible();
  await expect(page.getByText('1 player receives it · 1 pending')).toBeVisible();
  await expect(page.getByText('Demo Player', { exact: true })).toBeVisible();

  // 3. El jugador elegido lo ve (marcado «For you») y el otro no.
  const targeted = await browser.newContext();
  const targetedPage = await targeted.newPage();
  await login(targetedPage, 'player@demo.com', 'player123');
  await targetedPage.goto(`${BASE}/dashboard/player/training`);
  await targetedPage.getByRole('button', { name: 'Exercises' }).click();
  await expect(targetedPage.getByText(title).first()).toBeVisible();
  await expect(targetedPage.getByText('For you').first()).toBeVisible();
  await targeted.close();

  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await login(otherPage, 'player2@demo.com', 'player2123');
  await otherPage.goto(`${BASE}/dashboard/player/training`);
  await otherPage.getByRole('button', { name: 'Exercises' }).click();
  await expect(otherPage.getByText(title)).toHaveCount(0);
  await other.close();

  // 4. El recordatorio llega solo a quien le falta.
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Send reminder' }).click(),
  ]);
  await page.waitForURL('**/edit', { timeout: 15_000 });

  const reminded = await browser.newContext();
  const remindedPage = await reminded.newPage();
  await login(remindedPage, 'player@demo.com', 'player123');
  await remindedPage.goto(`${BASE}/dashboard/player/notifications`);
  await expect(remindedPage.getByText(`${title} is still pending`).first()).toBeVisible();
  await reminded.close();

  // 5. Limpieza: el test borra lo que ha creado.
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
  await openCoachCenter(page);
  await expect(page.getByText(title)).toHaveCount(0);
});
