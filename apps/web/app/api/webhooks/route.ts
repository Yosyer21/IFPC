import { NextResponse } from 'next/server';
import { methodNotAllowed } from '@/lib/api/respond';

/**
 * POST /api/webhooks — receptor de webhooks de Stripe.
 * En esta fase devuelve 501: la integración con Stripe llega en P2.
 */
export async function POST() {
  return NextResponse.json(
    { ok: false, error: 'Webhooks de Stripe no configurados todavía' },
    { status: 501 }
  );
}

export async function GET() {
  return methodNotAllowed();
}

