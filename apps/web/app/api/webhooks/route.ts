import { NextResponse } from 'next/server';
import { prisma } from '@future-buller/database';
import { verifyWebhookSignature } from '@/lib/payments/stripe';
import { methodNotAllowed } from '@/lib/api/respond';

/**
 * POST /api/webhooks — receptor de webhooks de Stripe.
 * Verifica la firma (`Stripe-Signature`) y procesa `checkout.session.completed`
 * creando el Payment y actualizando la Membership del usuario.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: 'Firma no válida' }, { status: 400 });
  }

  let event: {
    type?: string;
    data?: { object?: Record<string, unknown> };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: 'Body no válido' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const object = event.data?.object ?? {};
    const userId = typeof object.client_reference_id === 'string' ? object.client_reference_id : null;
    const tier =
      typeof object.metadata === 'object' &&
      object.metadata !== null &&
      typeof (object.metadata as Record<string, unknown>).tier === 'string'
        ? ((object.metadata as Record<string, unknown>).tier as string)
        : null;

    if (userId && tier && ['PREMIUM', 'SCOUT', 'CLUB'].includes(tier)) {
      const amount = typeof object.amount_total === 'number' ? object.amount_total : 0;
      const currency = (typeof object.currency === 'string' ? object.currency : 'eur').toUpperCase();
      const paymentIntent =
        typeof object.payment_intent === 'string' ? object.payment_intent : null;

      await prisma.$transaction([
        prisma.payment.create({
          data: {
            userId,
            amount,
            currency,
            status: 'PAID',
            description: `Membresía ${tier}`,
            stripePaymentIntentId: paymentIntent,
          },
        }),
        prisma.membership.upsert({
          where: { userId },
          update: {
            tier: tier as 'PREMIUM' | 'SCOUT' | 'CLUB',
            startsAt: new Date(),
            endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
          create: {
            userId,
            tier: tier as 'PREMIUM' | 'SCOUT' | 'CLUB',
            startsAt: new Date(),
            endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        }),
      ]);
    }
  }

  return NextResponse.json({ ok: true, received: true });
}

export async function GET() {
  return methodNotAllowed();
}

