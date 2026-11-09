import { test, expect, type Page } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function loginAsPlayer(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('player@demo.com');
  await page.getByLabel('Password').fill('player123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15_000 });
}

/** Elementos que se salen del viewport (los 3 primeros, para el mensaje). */
async function overflowOffenders(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;

    // Un elemento puede sobresalir a propósito si un ancestro lo recorta
    // (marquee, blobs decorativos). Solo cuenta si llega al viewport sin clip.
    const isClipped = (el: HTMLElement) => {
      let parent = el.parentElement;
      while (parent) {
        const style = getComputedStyle(parent);
        if (style.overflowX !== 'visible' || style.overflowY !== 'visible') {
          const rect = parent.getBoundingClientRect();
          if (rect.right <= vw + 1) return true;
        }
        parent = parent.parentElement;
      }
      return false;
    };

    return [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (rect.width === 0 || style.visibility === 'hidden' || style.position === 'fixed') {
          return false;
        }
        if (rect.right <= vw + 1) return false;
        return !isClipped(el);
      })
      .slice(0, 3)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 90)}`);
  });
}

async function expectNoHorizontalScroll(page: Page, path: string) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(400);

  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(
    scrollWidth,
    `${path} desborda horizontalmente (${scrollWidth} > ${clientWidth})`
  ).toBeLessThanOrEqual(clientWidth + 1);
  expect(await overflowOffenders(page), `${path} tiene elementos fuera del viewport`).toEqual([]);
}

test.describe('Mobile (390x844)', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('landing pública y páginas legales no desbordan', async ({ page }) => {
    await page.goto(`${BASE}/`);
    // El viewport móvil está declarado con viewport-fit=cover.
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewportMeta).toContain('viewport-fit=cover');

    // La landing ofrece la app y el APK se sirve de verdad.
    const apkLink = page.getByRole('link', { name: /download the apk/i });
    await expect(apkLink).toBeVisible();
    await expect(apkLink).toHaveAttribute('href', '/downloads/future-baller.apk');

    const apk = await page.request.get(`${BASE}/downloads/future-baller.apk`);
    expect(apk.status()).toBe(200);
    expect((await apk.body()).byteLength).toBeGreaterThan(50_000);

    for (const path of [
      '/',
      '/about',
      '/activities',
      '/events',
      '/products',
      '/contact',
      '/opportunities',
      '/login',
    ]) {
      await expectNoHorizontalScroll(page, path);
    }
  });

  test('área del jugador: menú y páginas clave sin desbordes', async ({ page }) => {
    await loginAsPlayer(page);

    // Drawer móvil: cabe en pantalla y se cierra al navegar.
    await page.getByRole('button', { name: 'Open menu' }).click();
    const drawer = page.getByRole('dialog', { name: 'Navigation' });
    await expect(drawer).toBeVisible();
    const drawerBox = await drawer.boundingBox();
    expect(drawerBox?.width ?? 0).toBeLessThanOrEqual(390);
    await drawer.getByRole('link', { name: 'Profile center' }).click();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();

    for (const path of [
      '/dashboard/player',
      '/dashboard/player/opportunities',
      '/dashboard/player/profile-center/profile',
      '/dashboard/player/profile-center/id',
      '/dashboard/player/profile-center/development',
      '/dashboard/player/calendar',
      '/dashboard/player/notifications',
      '/dashboard/discovery',
      '/dashboard/player/training',
      '/dashboard/player/opportunities/applications',
    ]) {
      await expectNoHorizontalScroll(page, path);
    }
  });
});
