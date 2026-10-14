import { spawn, type ChildProcess } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { expect, test, type Browser, type Page } from '@playwright/test';

/**
 * Salas de vídeo end-to-end con **dispositivos falsos** de Chromium: dos personas
 * entran, se comprueba que los medios llegan de verdad (contadores `__roomStats`,
 * que cuentan frames recibidos), el chat, el micro, compartir pantalla, la
 * expulsión y el cierre de la sala.
 *
 * El servicio `rtc` se reutiliza si ya está levantado en :4001 y, si no, se arranca
 * aquí con el mismo secreto que usa la web (`.env`), porque los tokens los firma
 * la web y los verifica el servicio.
 */
const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const RTC_URL = process.env.E2E_RTC_URL ?? 'http://127.0.0.1:4001';

let service: ChildProcess | null = null;
let reuseService = false;

/** Secreto de tokens de sala: el de la web (`ROOM_TOKEN_SECRET` o `AUTH_SECRET`). */
function roomSecret(): string {
  if (process.env.ROOM_TOKEN_SECRET) return process.env.ROOM_TOKEN_SECRET;
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;

  try {
    const env = readFileSync('.env', 'utf8');
    const line = env.split('\n').find((row) => row.startsWith('AUTH_SECRET='));
    if (line) return line.slice('AUTH_SECRET='.length).trim();
  } catch {
    // Sin .env: se usa el respaldo de desarrollo.
  }
  return 'ifpc-dev-room-secret';
}

async function serviceAlive(): Promise<boolean> {
  try {
    const response = await fetch(`${RTC_URL}/healthz`);
    return response.ok;
  } catch {
    return false;
  }
}

test.beforeAll(async () => {
  if (await serviceAlive()) {
    reuseService = true;
    return;
  }

  service = spawn('node', ['--import=tsx', 'apps/rtc/src/index.ts'], {
    env: { ...process.env, PORT: '4001', ROOM_TOKEN_SECRET: roomSecret() },
  });
  service.stdout?.on('data', () => undefined);
  service.stderr?.on('data', () => undefined);

  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await serviceAlive()) return;
    await delay(250);
  }
  throw new Error('El servicio de salas no arrancó en :4001');
});

test.afterAll(() => {
  if (service && !reuseService) service.kill('SIGKILL');
});

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

/** Abre la sala y espera a estar dentro. */
async function joinRoom(page: Page, url: string, expectInside: number) {
  await page.goto(url);
  await page.getByRole('button', { name: 'Join the room' }).click();
  await expect(page.getByText(`${expectInside}/4 in the room`)).toBeVisible({ timeout: 20_000 });
  try {
    await page.waitForFunction('window.__roomStats && window.__roomStats.phase === "joined"', null, {
      timeout: 20_000,
    });
  } catch {
    // Si el cliente no llega a entrar (p. ej. sin permiso de cámara), el motivo
    // está en la propia página: se incluye para que el fallo sea legible.
    const text = await page.locator('body').innerText();
    throw new Error(`No se llegó a 'joined'. Página: ${text.slice(0, 600).replace(/\s+/g, ' ')}`);
  }
}

/** Espera a que lleguen frames de vídeo del otro lado (medios de verdad). */
async function expectRemoteVideo(page: Page) {
  await page.waitForFunction('window.__roomStats && window.__roomStats.videoIn > 0', null, {
    timeout: 40_000,
  });
}

async function newRoomPage(browser: Browser, email: string, password: string): Promise<Page> {
  // Los contextos propios no heredan `use` del proyecto: los permisos se piden aquí.
  const context = await browser.newContext({ permissions: ['camera', 'microphone'] });
  const page = await context.newPage();
  await login(page, email, password);
  return page;
}

test('Salas: dos personas entran, se ven, hablan y el host modera', async ({ page, browser }) => {
  await login(page, 'coach@demo.com', 'coach123');

  // 1. El coach abre una sala e invita a un jugador (la primera casilla).
  await page.goto(`${BASE}/dashboard/rooms`);
  const title = `E2E room ${Date.now()}`;
  await page.getByLabel('Room title').fill(title);
  await page.getByLabel('Recipients').selectOption('SELECTED');
  await page
    .locator('fieldset')
    .filter({ hasText: 'Who is it for' })
    .getByRole('checkbox', { name: /demo/i })
    .check();
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Open room' }).click(),
  ]);
  await page.waitForURL('**/dashboard/rooms/**', { timeout: 20_000 });
  const roomUrl = page.url();

  // 2. El coach entra y su propia cámara (dispositivos falsos) se ve en la rejilla.
  await page.getByRole('button', { name: 'Join the room' }).click();
  await expect(page.getByText('1/4 in the room')).toBeVisible({ timeout: 20_000 });
  await page.waitForFunction('window.__roomStats && window.__roomStats.phase === "joined"', null, {
    timeout: 20_000,
  });
  const selfIndex = await page.evaluate(
    () => (window as unknown as { __roomStats?: { selfIndex?: number } }).__roomStats?.selfIndex ?? 0
  );
  await expect(page.getByTestId(`tile-${selfIndex}`).locator('video')).toBeVisible();

  // 3. El jugador invitado entra: los dos se ven (frames de vídeo reales).
  const playerPage = await newRoomPage(browser, 'player@demo.com', 'player123');
  await joinRoom(playerPage, roomUrl, 2);
  await expect(page.getByText('2/4 in the room')).toBeVisible({ timeout: 20_000 });

  await expectRemoteVideo(page);
  await expectRemoteVideo(playerPage);

  // 4. Chat en la sala.
  await page.getByLabel('Message').fill('hola equipo');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(playerPage.getByTestId('chat')).toContainText('hola equipo', { timeout: 10_000 });

  // 5. El micro se apaga y el otro lo ve.
  await page.getByRole('button', { name: 'Mute' }).click();
  await expect(playerPage.locator('[title="Muted"]').first()).toBeVisible({ timeout: 10_000 });

  // 6. Compartir pantalla y volver a la cámara.
  await page.getByRole('button', { name: 'Share screen' }).click();
  await expect(page.getByRole('button', { name: 'Stop sharing' })).toBeVisible({ timeout: 15_000 });
  await expect(playerPage.locator('[title="Sharing screen"]').first()).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole('button', { name: 'Stop sharing' }).click();
  await expect(page.getByRole('button', { name: 'Share screen' })).toBeVisible({ timeout: 10_000 });

  // 7. El host expulsa al jugador y este se entera.
  const playerIndex = await playerPage.evaluate(
    () => (window as unknown as { __roomStats?: { selfIndex?: number } }).__roomStats?.selfIndex ?? 1
  );
  await page.getByTestId(`remove-${playerIndex}`).click();
  await expect(playerPage.getByText('The host removed you.')).toBeVisible({ timeout: 15_000 });

  // 8. Y cierra la sala: vuelve a la lista con la sala terminada.
  await page.getByRole('button', { name: 'End room' }).click();
  await page.waitForURL('**/dashboard/rooms', { timeout: 20_000 });
  const card = page.locator('.glass-card').filter({ hasText: title }).first();
  await expect(card).toContainText('Ended', { timeout: 10_000 });

  await playerPage.context().close();
});

test('Salas: quien no está invitado no entra', async ({ page, browser }) => {
  await login(page, 'coach@demo.com', 'coach123');

  await page.goto(`${BASE}/dashboard/rooms`);
  const title = `E2E private ${Date.now()}`;
  await page.getByLabel('Room title').fill(title);
  await page.getByLabel('Recipients').selectOption('SELECTED');
  await page
    .locator('fieldset')
    .filter({ hasText: 'Who is it for' })
    .getByRole('checkbox', { name: /demo/i })
    .check();
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Open room' }).click(),
  ]);
  await page.waitForURL('**/dashboard/rooms/**', { timeout: 20_000 });
  const roomUrl = page.url();

  // El segundo jugador de demo no está en la lista de invitados.
  const outsider = await newRoomPage(browser, 'player2@demo.com', 'player2123');
  await outsider.goto(roomUrl);
  await expect(outsider.getByText('This room is not for you')).toBeVisible({ timeout: 15_000 });

  // Limpieza: el coach termina y borra la sala.
  await page.goto(`${BASE}/dashboard/rooms`);
  await page
    .locator('form')
    .filter({ has: page.getByRole('button', { name: 'End room' }) })
    .first()
    .getByRole('button', { name: 'End room' })
    .click();
  await page.waitForURL('**/dashboard/rooms', { timeout: 20_000 });
  await page.getByRole('button', { name: 'Delete' }).first().click();
  await page.waitForURL('**/dashboard/rooms', { timeout: 20_000 });

  await outsider.context().close();
});
