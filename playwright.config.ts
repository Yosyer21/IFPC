import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  // PGlite (BD embebida) no soporta acceso concurrente desde varios workers → 1 worker.
  workers: 1,
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    // Cámara y micro **falsos** de Chromium: permiten que el test de salas de
    // vídeo compruebe que los medios llegan de verdad, sin dispositivos reales.
    permissions: ['camera', 'microphone'],
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--autoplay-policy=no-user-gesture-required',
        // Para que `getDisplayMedia` elija algo sin diálogo.
        '--auto-select-desktop-capture-source=Entire screen',
        // Los candidatos ICE van con la IP real: la vía directa (WebRTC) conecta
        // entre los dos navegadores del test sin depender de resolución mDNS.
        '--disable-features=WebRtcHideLocalIpsWithMdns',
      ],
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
