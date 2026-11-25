interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Limitador en memoria (ventana fija) para acciones sensibles: login, registro
 * y recuperación de contraseña. No sustituye a un limitador distribuido
 * (Redis/Upstash) en producción con varias instancias, pero frena fuerza bruta
 * y abuso básico sin añadir infraestructura.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitResult {
  if (buckets.size > MAX_BUCKETS) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: Math.max(0, limit - 1), retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: Math.max(0, limit - bucket.count), retryAfterSeconds: 0 };
}

/** Limpia un bucket (p. ej. tras un login correcto). */
export function clearRateLimit(key: string): void {
  buckets.delete(key);
}

/** Solo para tests. */
export function clearAllRateLimits(): void {
  buckets.clear();
}
