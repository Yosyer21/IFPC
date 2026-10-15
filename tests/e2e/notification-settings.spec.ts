import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const NOTIFICATIONS = `${BASE}/dashboard/player/settings/notifications`;

type Page = import('@playwright/test').Page;

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('player@demo.com');
  await page.getByLabel('Password').fill('player123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

test('Ajustes de avisos: canales por categoría y persistencia', async ({ page }) => {
  // Nota: guardar crea una fila por categoría (upsert). Al terminar, la única fila
  // del resumen semanal queda con `email = false` y las categorías con sus valores
  // por defecto, así que el estado es equivalente a no tener ninguna.
  await login(page);
  await page.goto(NOTIFICATIONS);

  // Las tres categorías que genera la plataforma, con su descripción.
  await expect(page.getByText('Likes, comments and mentions')).toBeVisible();
  await expect(page.getByText('Opportunities', { exact: true })).toBeVisible();
  await expect(page.getByText('Training and live sessions')).toBeVisible();

  // Dentro de la plataforma, todo activo por defecto; el email, apagado.
  const inAppSocial = page.locator('input[name="inApp:social"]');
  const emailSocial = page.locator('input[name="email:social"]');
  await expect(inAppSocial).toBeChecked();
  await expect(emailSocial).not.toBeChecked();
  // Sin email verificado, el canal de email está deshabilitado.
  await expect(emailSocial).toBeDisabled();
  await expect(page.getByText(/Email notifications need a verified address/)).toBeVisible();

  // Silencio la categoría social y guardo.
  await inAppSocial.uncheck();
  await page.getByRole('button', { name: 'Save preferences' }).click();
  await expect(page.getByText('Notification preferences saved.')).toBeVisible();

  // Persiste al recargar.
  await page.reload();
  await expect(inAppSocial).not.toBeChecked();
  await expect(page.locator('input[name="inApp:training"]')).toBeChecked();

  // Limpieza: vuelve a estar activo.
  await inAppSocial.check();
  await page.getByRole('button', { name: 'Save preferences' }).click();
  await expect(page.getByText('Notification preferences saved.')).toBeVisible();
  await page.reload();
  await expect(inAppSocial).toBeChecked();
});
