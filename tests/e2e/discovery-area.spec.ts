/**
 * Discovery: recorrido de extremo a extremo del feed (área privada y espejo
 * público).
 *
 * Requiere la app levantada (`pnpm dev`) y los datos de demo (`pnpm db:seed`),
 * igual que el resto de specs de `tests/e2e`. Cada prueba crea sus propias
 * publicaciones con un identificador único —el guardarraíl rechaza el mismo texto
 * dos veces en 10 minutos— y las borra al terminar, así que no deja basura en la
 * base de datos ni ficheros huérfanos en `uploads/`.
 *
 * Nota sobre esperas: los formularios de las server actions sólo funcionan cuando
 * React ha hidratado, así que nunca se comprueba su estado con un `count()`
 * inmediato (que puede ver la página antes de tiempo y saltarse el clic). Se usan
 * localizadores que auto-esperan (`.click()`, `expect(...).toBeVisible()`) y, en
 * los pasos con riesgo de perder el primer clic, un reintento acotado.
 */
import { test, expect, type Page } from '@playwright/test';

// Cada prueba recorre dos sesiones, sube ficheros y reintenta algún clic.
test.describe.configure({ timeout: 90_000 });

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const MARK = `E2E-DISCOVERY-${Date.now()}`;

/** Publicaciones del seed (`packages/database/prisma/seed.ts`), ids fijos. */
const SEED = {
  highlights: 'Mis mejores jugadas de la temporada',
  becas: 'Becas deportivas 2026',
  torneo: 'torneo regional',
};

/** PNG 1×1 válido: el compositor valida tipo y tamaño del archivo. */
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64'
);

async function login(page: Page, email = 'player@demo.com', password = 'player123') {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 20_000 });
}

/** Tarjeta de una publicación por su texto (raíz `Card` del componente). */
function postCard(page: Page, text: string) {
  return page.locator('.animate-fade-up').filter({ hasText: text }).first();
}

/** Formulario del compositor (el único con el campo «¿Qué quieres contar?»). */
function composer(page: Page) {
  return page
    .locator('form')
    .filter({ has: page.getByLabel('¿Qué quieres contar?') })
    .first();
}

/** Pestañas del feed. */
function feedTabs(page: Page) {
  return page.getByRole('navigation', { name: 'Secciones del feed' });
}

async function openFeed(page: Page) {
  await page.goto(`${BASE}/dashboard/discovery`);
}

/** Publica desde el compositor y espera a verla en el feed. */
async function publish(page: Page, body: string) {
  await openFeed(page);
  const form = composer(page);
  await form.getByLabel('¿Qué quieres contar?').fill(body);
  await form.getByRole('button', { name: 'Publicar' }).click();
  await expect(postCard(page, body)).toBeVisible({ timeout: 30_000 });
}

/**
 * Borra una publicación propia desde su tarjeta del feed, con la confirmación del
 * navegador. Si el primer clic se pierde antes de hidratar, se reintenta.
 */
async function deleteOwnPost(page: Page, body: string) {
  await expect(async () => {
    await openFeed(page);
    const remove = postCard(page, body).getByRole('button', { name: 'Borrar' });
    page.once('dialog', (dialog) => dialog.accept());
    await remove.click({ timeout: 15_000 }).catch(() => undefined);
    await expect(page.getByText(body)).toHaveCount(0, { timeout: 10_000 });
  }).toPass({ timeout: 30_000, intervals: [1_000] });
}

test('feed privado: pestañas accesibles, búsqueda y directorio de perfiles', async ({ page }) => {
  await login(page);
  await openFeed(page);

  // Pestañas: enlaces con `aria-current` en la activa (son navegación, no paneles).
  const tabs = feedTabs(page);
  await expect(tabs).toBeVisible();
  await expect(tabs.getByRole('link')).toHaveCount(7);
  await expect(tabs.locator('[aria-current="page"]')).toHaveText('Recientes');
  await expect(postCard(page, SEED.highlights)).toBeVisible({ timeout: 20_000 });

  // Directorio de perfiles: otra consulta, misma pestaña (`?tab=profiles`).
  await tabs.getByRole('link', { name: 'Perfiles' }).click();
  await expect(page).toHaveURL(/tab=profiles/);
  await expect(tabs.locator('[aria-current="page"]')).toHaveText('Perfiles');
  await expect(page.getByRole('link', { name: 'Demo Player' }).first()).toBeVisible();

  // Búsqueda: el estado vive en la URL y filtra por texto. Hay que esperar a que la
  // pestaña «Recientes» esté activa: si no, el formulario se enviaría desde el
  // directorio de perfiles (que también tiene buscador).
  await tabs.getByRole('link', { name: 'Recientes' }).click();
  await expect(tabs.locator('[aria-current="page"]')).toHaveText('Recientes');
  await page.getByRole('searchbox', { name: 'Buscar en Discovery' }).fill('becas');
  await page.getByRole('button', { name: 'Filtrar' }).click();
  await expect(page).toHaveURL(/q=becas/);
  await expect(postCard(page, SEED.becas)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(SEED.torneo)).toHaveCount(0);

  // Quitar la búsqueda devuelve el feed completo.
  await page.getByRole('link', { name: 'Quitar búsqueda' }).click();
  await expect(postCard(page, SEED.torneo)).toBeVisible({ timeout: 20_000 });
});

test('compositor: galería y encuesta, voto, comentario y borrado', async ({ page }) => {
  await login(page);
  const body = `${MARK} galería con encuesta`;

  await openFeed(page);
  const form = composer(page);
  await form.getByLabel('¿Qué quieres contar?').fill(`${body} #sub17`);
  await form.getByLabel(/^Galería/).setInputFiles([
    { name: 'galeria-1.png', mimeType: 'image/png', buffer: PNG_1PX },
    { name: 'galeria-2.png', mimeType: 'image/png', buffer: PNG_1PX },
  ]);
  await form.getByPlaceholder('Opción 1 (mínimo dos)').fill('Sí, encaja');
  await form.getByPlaceholder('Opción 2 (mínimo dos)').fill('No encaja');
  await form.getByRole('button', { name: 'Publicar' }).click();

  // La tarjeta muestra la galería completa y la encuesta a cero.
  const card = postCard(page, body);
  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(card.locator('img')).toHaveCount(2);
  await expect(card.getByText('Encuesta · 0 votos')).toBeVisible();

  // Votar cuenta el voto (server action + revalidación).
  await card.getByRole('button', { name: 'Votar Sí, encaja' }).click();
  await expect(card.getByText('Encuesta · 1 voto')).toBeVisible({ timeout: 20_000 });
  await expect(card.getByText('100% · 1')).toBeVisible();

  // Detalle: comentario propio. El hilo aparece sin recargar (la acción revalida
  // feed y detalle); si el primer clic se pierde, se reintenta.
  await card.getByRole('link', { name: 'Comentarios' }).click();
  await expect(page).toHaveURL(/\/dashboard\/discovery\/[a-z0-9]+$/);
  await page.getByPlaceholder('Escribe un comentario…').fill(`${MARK} comentario`);
  await expect(async () => {
    await page
      .getByRole('button', { name: 'Comentar' })
      .click({ timeout: 10_000 })
      .catch(() => undefined);
    await expect(page.getByText(`${MARK} comentario`).first()).toBeVisible({ timeout: 10_000 });
  }).toPass({ timeout: 30_000, intervals: [1_000] });
  await expect(page.getByRole('heading', { name: /Comentarios \(1\)/ })).toBeVisible();

  // Y al borrarlo vuelve a quedarse vacío (misma revalidación).
  const commentDelete = page
    .locator('form')
    .filter({ has: page.locator('input[name="commentId"]') })
    .getByRole('button', { name: 'Borrar' });
  await expect(async () => {
    await commentDelete.click({ timeout: 10_000 }).catch(() => undefined);
    await expect(page.getByText('Todavía no hay comentarios. Sé el primero.')).toBeVisible({
      timeout: 8_000,
    });
  }).toPass({ timeout: 30_000, intervals: [1_000] });

  // Borrar la publicación borra también su medio (ficheros incluidos).
  await deleteOwnPost(page, body);
});

test('«no me interesa»: se oculta solo para quien la marca y se deshace', async ({
  page,
  browser,
}) => {
  await login(page);
  const body = `${MARK} marca privada`;
  await publish(page, body);

  // Quien publica no puede marcarse su propia publicación.
  await expect(postCard(page, body).getByRole('button', { name: 'No me interesa' })).toHaveCount(0);

  const otherContext = await browser.newContext();
  const club = await otherContext.newPage();
  await login(club, 'club@demo.com', 'club123');
  await openFeed(club);

  const clubCard = postCard(club, body);
  await expect(clubCard).toBeVisible({ timeout: 30_000 });
  // El enlace «Comentarios» lleva al detalle (el avatar lleva al perfil).
  const href = await clubCard.getByRole('link', { name: 'Comentarios' }).getAttribute('href');
  expect(href).toMatch(/^\/dashboard\/discovery\/[a-z0-9]+$/);

  // Marcar la quita de su feed (revalidación de la acción).
  await clubCard.getByRole('button', { name: 'No me interesa' }).click();
  await expect(club.getByText(body)).toHaveCount(0, { timeout: 30_000 });

  // La marca es privada: el espejo público la sigue mostrando.
  await club.goto(`${BASE}${href!.replace('/dashboard', '')}`);
  await expect(club.getByText(body).first()).toBeVisible({ timeout: 20_000 });

  // Y el detalle privado ofrece deshacer: el botón revierte a «No me interesa».
  await club.goto(`${BASE}${href}`);
  await expect(async () => {
    await club
      .locator('button:has-text("Volver a mostrar")')
      .click({ timeout: 8_000 })
      .catch(() => undefined);
    await expect(club.locator('button:has-text("No me interesa")').first()).toBeVisible({
      timeout: 8_000,
    });
  }).toPass({ timeout: 30_000, intervals: [1_000] });

  // Y vuelve al feed de quien la había descartado.
  await openFeed(club);
  await expect(club.getByText(body).first()).toBeVisible({ timeout: 20_000 });
  await otherContext.close();

  // Limpieza (borra también la marca, en cascada).
  await deleteOwnPost(page, body);
});

test('borradores: guardar, publicar desde la tarjeta y borrar', async ({ page }) => {
  await login(page);
  const body = `${MARK} borrador`;
  await openFeed(page);

  const form = composer(page);
  await form.getByLabel('¿Qué quieres contar?').fill(body);
  await form.getByRole('button', { name: 'Guardar borrador' }).click();

  // El borrador solo lo ve su autor y no aparece en el feed.
  const drafts = page.locator('section').filter({ hasText: 'Tus borradores' }).first();
  await expect(drafts.getByText(body)).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.animate-fade-up').filter({ hasText: body })).toHaveCount(0);

  // Publicar desde la tarjeta lo saca al feed.
  await drafts.getByRole('button', { name: 'Publicar', exact: true }).click();
  await expect(postCard(page, body)).toBeVisible({ timeout: 30_000 });

  await deleteOwnPost(page, body);
});

test('espejo público: solo lectura, pestañas públicas y SEO', async ({ page }) => {
  // Sin sesión: el espejo público no pide login.
  await page.goto(`${BASE}/discovery`);
  await expect(page).toHaveTitle(/Discovery — Future Baller/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Discovery/);

  // Feed de solo lectura: ni compositor ni acciones de autor.
  await expect(page.getByLabel('¿Qué quieres contar?')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Borrar' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Compartir' })).toHaveCount(0);

  // Solo las pestañas públicas: "Para ti" y "Siguiendo" necesitan espectador.
  const tabs = feedTabs(page);
  await expect(tabs.getByRole('link', { name: 'Recientes' })).toBeVisible();
  await expect(tabs.getByRole('link', { name: 'Para ti' })).toHaveCount(0);
  await expect(tabs.getByRole('link', { name: 'Siguiendo' })).toHaveCount(0);
  await expect(postCard(page, SEED.highlights)).toBeVisible({ timeout: 20_000 });

  // El detalle público también responde (es la URL que se comparte).
  await page.goto(`${BASE}/discovery/seed-post-2`);
  await expect(page.getByText(SEED.highlights).first()).toBeVisible({ timeout: 20_000 });
});
