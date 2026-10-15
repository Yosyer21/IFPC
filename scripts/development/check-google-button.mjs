/**
 * Comprueba que el botón «Continue with Google» está en /login y lleva a Google con
 * el `client_id` y el `redirect_uri` correctos, **sin** completar el consentimiento.
 * Sirve de verificación rápida tras cambiar credenciales o dominio.
 *
 *   pnpm scripts:google-check                                   # producción (o CHECK_BASE)
 *   CHECK_BASE=http://localhost:3000 pnpm scripts:google-check  # local
 */
import { chromium } from '@playwright/test';

const BASE = process.env.CHECK_BASE ?? 'https://futureballler.up.railway.app';
const EXPECTED = `${BASE}/api/auth/callback/google`;

const browser = await chromium.launch();
const page = await browser.newPage();
try {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /continue with google/i }).click();
  await page.waitForURL(/accounts\.google\.com/, { timeout: 30_000 });

  const url = new URL(page.url());
  const redirectUri = url.searchParams.get('redirect_uri');
  console.log('base:', BASE);
  console.log('destino:', url.origin + url.pathname);
  console.log('client_id:', url.searchParams.get('client_id'));
  console.log('redirect_uri:', redirectUri);
  console.log('scope:', url.searchParams.get('scope'));
  console.log(
    redirectUri === EXPECTED
      ? 'OK: el redirect_uri coincide con el registrado en Google'
      : `OJO: se esperaba ${EXPECTED}`
  );
} catch (error) {
  console.log('base:', BASE);
  console.log('ERROR:', String(error.message).split('\n')[0]);
} finally {
  await browser.close();
}
