import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

/** PNG 1×1 válido: basta para probar la subida de la portada. */
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

async function loginAsPlayer(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('player@demo.com');
  await page.getByLabel('Password').fill('player123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

test('Player area: navigation, saving opportunity, status and documents', async ({ page }) => {
  await loginAsPlayer(page);

  // 1. Sidebar con secciones plegables del player
  await page.goto(`${BASE}/dashboard/player`);
  // The active section (Main) opens automatically
  await expect(page.getByRole('link', { name: 'My development' })).toBeVisible();
  // The other sections start collapsed and open when clicked
  await page.getByRole('button', { name: 'Content' }).click();
  await expect(page.getByRole('link', { name: 'My documents' })).toBeVisible();
  await page.getByRole('button', { name: 'My career' }).click();
  await expect(page.getByRole('link', { name: 'Opportunities', exact: true })).toBeVisible();

  // 1b. Redesigned dashboard: hero, chart and dynamic counters
  await expect(
    page.getByRole('heading', { name: /Good morning|Good afternoon|Good evening/ })
  ).toBeVisible();
  await expect(page.getByText('Level by category')).toBeVisible();
  await expect(page.getByText('Profile complete')).toBeVisible();
  await expect(page.getByText('Recent activity')).toBeVisible();
  await expect(page.getByRole('link', { name: 'View public profile' })).toBeVisible();

  // 2. Save / quitar oportunidad
  await page.goto(`${BASE}/dashboard/player/opportunities/opp-club-1`);
  await expect(page.getByRole('heading', { name: 'U-17 youth trial' })).toBeVisible();
  // Viene guardada por seed
  await expect(page.getByRole('button', { name: 'Remove from saved' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove from saved' }).click();
  await expect(page.getByRole('button', { name: 'Save opportunity' })).toBeVisible();
  await page.getByRole('button', { name: 'Save opportunity' }).click();
  await expect(page.getByRole('button', { name: 'Remove from saved' })).toBeVisible();

  // 3. Toggle de disponibilidad
  await page.goto(`${BASE}/dashboard/player/profile`);
  await expect(page.getByRole('button', { name: 'Mark as unavailable' })).toBeVisible();
  await page.getByRole('button', { name: 'Mark as unavailable' }).click();
  await expect(page.getByRole('button', { name: 'Mark as available' })).toBeVisible();
  await page.getByRole('button', { name: 'Mark as available' }).click();
  await expect(page.getByRole('button', { name: 'Mark as unavailable' })).toBeVisible();

  // 4. Upload document
  await page.goto(`${BASE}/dashboard/player/documents/upload`);
  const docTitle = `Test medical certificate ${Date.now()}`;
  await page.getByLabel('Document title').fill(docTitle);
  await page.getByLabel('Archivo').setInputFiles({
    name: 'test.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 demo document'),
  });
  await page.getByRole('button', { name: 'Upload document' }).click();
  await page.waitForURL('**/dashboard/player/documents', { timeout: 15_000 });
  await expect(page.getByText(docTitle)).toBeVisible();
});

test('Player area: hamburger menu on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAsPlayer(page);

  await page.goto(`${BASE}/dashboard/player`);
  await page.getByRole('button', { name: 'Open menu' }).click();
  // The drawer shows the navigation
  await expect(page.getByRole('link', { name: 'My development' })).toBeVisible();
  // When navigating, the drawer closes by itself
  await page.getByRole('link', { name: 'My development' }).click();
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close menu' })).toBeHidden();
});

test('Player area: personaliza su perfil (headline, acento, portada y checklist)', async ({
  page,
}) => {
  await loginAsPlayer(page);

  const headline = `Interior zurda E2E ${Date.now()}`;

  // 1. Edición: headline, ubicación, chips y color
  await page.goto(`${BASE}/dashboard/player/profile/edit`);
  await page.getByLabel('Headline').fill(headline);
  await page.getByLabel('Location').fill('Valencia, Spain');
  await page.getByLabel('Looking for a club').check();
  // El swatch se pinta sobre un radio `sr-only`: se marca sin comprobar el puntero.
  await page.getByRole('radio', { name: 'Cian' }).check({ force: true });
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.waitForURL('**/dashboard/player/profile', { timeout: 15_000 });

  // La cabecera personalizada muestra headline, ubicación y chip
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText(headline)).toBeVisible();
  await expect(page.getByText('Valencia, Spain')).toBeVisible();
  await expect(page.getByText('Looking for a club')).toBeVisible();

  // El acento elegido tiñe el contenedor del perfil (cian = #22d3ee)
  await expect(page.locator('div[style*="--profile-accent"]').first()).toHaveAttribute(
    'style',
    /#22d3ee/
  );

  // 2. Checklist de fuerza: el headline deja de estar pendiente
  await expect(page.getByRole('heading', { name: 'Profile strength' })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Headline/ })).toBeHidden();

  // 3. Portada: subir un PNG y quitarla
  await page.goto(`${BASE}/dashboard/player/profile/edit`);
  await page.getByLabel('Portada').setInputFiles({
    name: 'banner.png',
    mimeType: 'image/png',
    buffer: PNG_1X1,
  });
  await page.getByRole('button', { name: 'Save cover' }).click();
  await expect(page.getByAltText('Current cover')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Remove cover' }).click();
  await expect(page.getByAltText('Current cover')).toBeHidden({ timeout: 15_000 });

  // 4. Panel frontal: estadísticas, muro y chips para cambiar foto y portada
  await page.goto(`${BASE}/dashboard/player/profile`);
  await expect(page.getByRole('heading', { name: 'Stats' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'My posts' })).toBeVisible();
  await expect(page.getByText('My best plays of the season')).toBeVisible();
  await expect(page.getByLabel('Change photo')).toBeVisible();
  await expect(page.getByLabel('Change cover')).toBeVisible();

  // La portada se cambia desde la propia cabecera, sin pasar por el formulario
  await page.getByLabel('Change cover').setInputFiles({
    name: 'portada.png',
    mimeType: 'image/png',
    buffer: PNG_1X1,
  });
  await expect(page.getByRole('button', { name: 'Remove cover' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator('img[src^="/uploads/banners/"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Remove cover' }).click();
  await expect(page.getByRole('button', { name: 'Remove cover' })).toBeHidden({
    timeout: 15_000,
  });

  // Y la foto de perfil, igual
  await page.getByLabel('Change photo').setInputFiles({
    name: 'foto.png',
    mimeType: 'image/png',
    buffer: PNG_1X1,
  });
  await expect(page.getByRole('button', { name: 'Remove photo' })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('img[src^="/uploads/photos/"]').first()).toBeVisible();
  await page.getByRole('button', { name: 'Remove photo' }).click();
  await expect(page.getByRole('button', { name: 'Remove photo' })).toBeHidden({ timeout: 15_000 });

  // 5. My wall on Discovery: el mismo panel, editable porque es mi perfil
  await page.getByRole('link', { name: 'My wall on Discovery' }).click();
  await expect(page).toHaveURL(/\/dashboard\/discovery\/u\//, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Stats' })).toBeVisible();
  await expect(page.getByLabel('Change cover')).toBeVisible();
  await expect(page.getByText('My best plays of the season')).toBeVisible();

  // 6. Limpieza: el perfil demo vuelve a como estaba
  await page.goto(`${BASE}/dashboard/player/profile/edit`);
  await page.getByLabel('Headline').fill('');
  await page.getByLabel('Location').fill('');
  await page.getByLabel('Looking for a club').uncheck();
  await page.getByRole('radio', { name: 'Esmeralda' }).check({ force: true });
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.waitForURL('**/dashboard/player/profile', { timeout: 15_000 });
  await expect(page.getByText(headline)).toBeHidden();
});
