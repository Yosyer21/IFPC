import { NextResponse } from 'next/server';
import { prisma } from '@ifpc/database';

// Sonda ligera: nunca se cachea ni se prerenderiza.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/health — healthcheck de despliegue (Railway).
 *
 * Devuelve **200** si el proceso responde y la base de datos contesta, y **503**
 * si la base de datos no responde (para que un deploy mal configurado se marque
 * como no sano). Ojo: no confundir con el hub de salud de producto
 * (`/dashboard/health`, ver `docs/technical/health.md`).
 */
export async function GET() {
  const startedAt = Date.now();
  let db: 'ok' | 'down' = 'down';
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = 'ok';
  } catch {
    db = 'down';
  }

  const healthy = db === 'ok';
  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      service: 'ifpc-web',
      db,
      uptimeSeconds: Math.round(process.uptime()),
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  );
}
