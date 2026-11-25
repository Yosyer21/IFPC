import { describe, expect, it } from 'vitest';
import { clearAllRateLimits, clearRateLimit, rateLimit } from '@/lib/security/rate-limit';

describe('rateLimit', () => {
  it('permite hasta el límite y bloquea el siguiente intento', () => {
    clearAllRateLimits();
    const now = 1_000_000;
    expect(rateLimit('login:ip', 2, 60_000, now).ok).toBe(true);
    expect(rateLimit('login:ip', 2, 60_000, now).ok).toBe(true);
    const blocked = rateLimit('login:ip', 2, 60_000, now);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);
  });

  it('se reinicia al terminar la ventana o al limpiar el bucket', () => {
    clearAllRateLimits();
    expect(rateLimit('reset', 1, 1000, 1000).ok).toBe(true);
    expect(rateLimit('reset', 1, 1000, 1500).ok).toBe(false);
    expect(rateLimit('reset', 1, 1000, 2500).ok).toBe(true);

    clearRateLimit('reset');
    expect(rateLimit('reset', 1, 1000, 2600).ok).toBe(true);
  });

  it('separa claves distintas', () => {
    clearAllRateLimits();
    expect(rateLimit('a', 1, 1000, 1000).ok).toBe(true);
    expect(rateLimit('b', 1, 1000, 1000).ok).toBe(true);
    expect(rateLimit('a', 1, 1000, 1000).ok).toBe(false);
  });
});
