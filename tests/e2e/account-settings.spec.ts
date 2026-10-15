import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const ACCOUNT = `${BASE}/dashboard/player/settings/account`;

/** PNG 1×1 válido: basta para probar la subida de la foto. */
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

type Page = import('@playwright/test').Page;

/** Formulario localizado por el texto exacto de su botón de envío. */
const form = (page: Page, text: string) => page.locator(`form:has(button:text-is("${text}"))`);
/** Campo dentro de ese formulario (las etiquetas se repiten entre tarjetas). */
const field = (page: Page, buttonText: string, name: string) =>
  form(page, buttonText).locator(`input[name="${name}"]`);

async function login(page: Page, password = 'player123') {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('player@demo.com');
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

async function changePassword(page: Page, current: string, next: string) {
  await field(page, 'Change password', 'currentPassword').fill(current);
  await field(page, 'Change password', 'newPassword').fill(next);
  await field(page, 'Change password', 'confirmPassword').fill(next);
  await form(page, 'Change password').getByRole('button', { name: 'Change password' }).click();
}

test('Ajustes de cuenta: cambia la contraseña (y la deja como estaba)', async ({ page }) => {
  await login(page);
  await page.goto(ACCOUNT);
  await expect(page.getByRole('heading', { name: 'Password' })).toBeVisible();

  // La contraseña actual se comprueba antes de cambiar nada.
  await changePassword(page, 'incorrecta', 'player-e2e-1234');
  await expect(page.getByText('The current password is not correct.')).toBeVisible();

  // Cambio real y comprobación de que sirve: nueva sesión con la temporal.
  await changePassword(page, 'player123', 'player-e2e-1234');
  await expect(page.getByText('Password updated.')).toBeVisible();
  await page.context().clearCookies();
  await login(page, 'player-e2e-1234');
  expect(page.url()).toContain('/dashboard');

  // Limpieza: vuelve la contraseña del seed.
  await page.goto(ACCOUNT);
  await changePassword(page, 'player-e2e-1234', 'player123');
  await expect(page.getByText('Password updated.')).toBeVisible();
});

test('Ajustes de cuenta: cambia el email, queda sin verificar y lo revierte', async ({ page }) => {
  const changeEmail = async (email: string, password: string) => {
    await field(page, 'Change email', 'email').fill(email);
    await field(page, 'Change email', 'currentPassword').fill(password);
    await form(page, 'Change email').getByRole('button', { name: 'Change email' }).click();
  };

  await login(page);
  await page.goto(ACCOUNT);

  // Validaciones: mismo email, contraseña de confirmación incorrecta.
  await changeEmail('player@demo.com', 'player123');
  await expect(page.getByText('That is already your email address.')).toBeVisible();
  await changeEmail('player.e2e@demo.com', 'mala');
  await expect(page.getByText('The password is not correct.')).toBeVisible();

  // Cambio real: el email pasa a estar sin verificar y se avisa por dónde va el enlace.
  await changeEmail('player.e2e@demo.com', 'player123');
  await page.goto(ACCOUNT);
  await expect(field(page, 'Change email', 'email')).toHaveValue('player.e2e@demo.com');
  await expect(page.getByText('Pending verification')).toBeVisible();
  await expect(page.getByText(/Open the link we sent to player\.e2e@demo\.com/)).toBeVisible();

  // Limpieza: vuelve el email del seed.
  await changeEmail('player@demo.com', 'player123');
  await page.goto(ACCOUNT);
  await expect(field(page, 'Change email', 'email')).toHaveValue('player@demo.com');
  await expect(page.getByText(/Open the link we sent to player@demo\.com/)).toBeVisible();
});

test('Ajustes de cuenta: sube y quita la foto de perfil', async ({ page }) => {
  await login(page);
  await page.goto(ACCOUNT);

  await form(page, 'Save photo')
    .locator('input[name="file"]')
    .setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: PNG_1X1 });
  await form(page, 'Save photo').getByRole('button', { name: 'Save photo' }).click();

  await expect(page.locator('img[src^="/uploads/photos/"]').first()).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole('button', { name: 'Remove photo' }).click();
  await expect(page.getByRole('button', { name: 'Remove photo' })).toBeHidden({
    timeout: 15_000,
  });
});
