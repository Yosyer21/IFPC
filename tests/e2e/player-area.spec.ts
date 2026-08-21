import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function loginAsPlayer(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('player@demo.com');
  await page.getByLabel('Contraseña').fill('player123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

test('Área player: navegación, guardar oportunidad, estado y documentos', async ({ page }) => {
  await loginAsPlayer(page);

  // 1. Sidebar con secciones plegables del jugador
  await page.goto(`${BASE}/dashboard/player`);
  // La sección activa (Principal) se abre automáticamente
  await expect(page.getByRole('link', { name: 'Mi desarrollo' })).toBeVisible();
  // Las demás secciones empiezan colapsadas y se abren al pulsarlas
  await page.getByRole('button', { name: 'Contenido' }).click();
  await expect(page.getByRole('link', { name: 'Mis documentos' })).toBeVisible();
  await page.getByRole('button', { name: 'Mi carrera' }).click();
  await expect(page.getByRole('link', { name: 'Oportunidades', exact: true })).toBeVisible();

  // 1b. Dashboard rediseñado: hero, gráfico y contadores dinámicos
  await expect(page.getByRole('heading', { name: /Buenos días|Buenas tardes|Buenas noches/ })).toBeVisible();
  await expect(page.getByText('Nivel por categoría')).toBeVisible();
  await expect(page.getByText('Perfil completado')).toBeVisible();
  await expect(page.getByText('Actividad reciente')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver perfil público' })).toBeVisible();

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
  const docTitle = `Certificado médico de prueba ${Date.now()}`;
  await page.getByLabel('Título del documento').fill(docTitle);
  await page.getByLabel('Archivo').setInputFiles({
    name: 'test.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 demo document'),
  });
  await page.getByRole('button', { name: 'Subir documento' }).click();
  await page.waitForURL('**/dashboard/player/documents', { timeout: 15_000 });
  await expect(page.getByText(docTitle)).toBeVisible();
});

test('Área player: menú hamburguesa en móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAsPlayer(page);

  await page.goto(`${BASE}/dashboard/player`);
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  // El cajón muestra la navegación
  await expect(page.getByRole('link', { name: 'Mi desarrollo' })).toBeVisible();
  // Al navegar, el cajón se cierra solo
  await page.getByRole('link', { name: 'Mi desarrollo' }).click();
  await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cerrar menú' })).toBeHidden();
});
