'use server';

import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { createCheckoutSession } from '@/lib/payments/stripe';
import type { MembershipTier } from '@ifpc/types';
import type { ActionState } from './auth';

// Precios alineados con lib/payments/stripe.ts (MEMBERSHIP_TIERS).
const PLANS: Record<string, { price: number; months: number }> = {
  PREMIUM: { price: 9900, months: 12 },
  SCOUT: { price: 19900, months: 12 },
  CLUB: { price: 49900, months: 12 },
};

/**
 * Inicia el pago de una membresía:
 * 1) Con STRIPE_SECRET_KEY → crea Checkout Session y redirige a Stripe.
 * 2) Sin Stripe (dev) → pago simulado local.
 */
export async function startCheckoutAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Sesión no válida.' };
  }
  const tier = (formData.get('tier') as string) ?? '';
  const plan = PLANS[tier];
  if (!plan) {
    return { error: 'Plan no válido.' };
  }

  try {
    const checkout = await createCheckoutSession({
      tier: tier as 'PREMIUM' | 'SCOUT' | 'CLUB',
      userId: session.user.id,
      userEmail: session.user.email ?? '',
    });
    if (checkout?.url) {
      redirect(checkout.url);
    }
  } catch (error) {
    console.error('[membership] error iniciando checkout:', error);
    return { error: 'No se pudo iniciar el pago con Stripe.' };
  }

  // Fallback de desarrollo: pago simulado (Stripe no configurado).
  const endsAt = new Date();
  endsAt.setMonth(endsAt.getMonth() + plan.months);

  try {
    await prisma.$transaction([
      prisma.membership.upsert({
        where: { userId: session.user.id },
        update: {
          tier: tier as MembershipTier,
          startsAt: new Date(),
          endsAt,
          status: 'PAID',
        },
        create: {
          userId: session.user.id,
          tier: tier as MembershipTier,
          startsAt: new Date(),
          endsAt,
          status: 'PAID',
        },
      }),
      prisma.payment.create({
        data: {
          userId: session.user.id,
          amount: plan.price,
          currency: 'EUR',
          status: 'PAID',
          description: `Membresía ${tier} (${plan.months} meses, simulada)`,
        },
      }),
    ]);
  } catch {
    return { error: 'No se pudo activar el plan.' };
  }

  redirect('/dashboard/player/membership');
}
