import { NextResponse } from 'next/server';
import { requireUser, badRequest, readJson, stringField } from '@/lib/api/respond';
import { createCheckoutSession } from '@/lib/payments/stripe';

/** POST /api/payments/checkout — creates a Stripe Checkout Session for a membership. */
export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  const body = await readJson(request);
  if (!body) return badRequest('Invalid JSON body');

  const tier = stringField(body, 'tier') ?? 'PREMIUM';
  if (!['PREMIUM', 'SCOUT', 'CLUB'].includes(tier)) return badRequest('invalid tier');

  try {
    const checkout = await createCheckoutSession({
      tier: tier as 'PREMIUM' | 'SCOUT' | 'CLUB',
      userId: session.user.id,
      userEmail: session.user.email ?? '',
    });
    if (!checkout || !checkout.url) {
      return NextResponse.json(
        { ok: false, error: 'Stripe no configurado' },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: true, url: checkout.url, sessionId: checkout.id });
  } catch (error) {
    console.error('[payments] error creando checkout:', error);
    return NextResponse.json(
      { ok: false, error: 'Could not create the payment session' },
      { status: 500 }
    );
  }
}
