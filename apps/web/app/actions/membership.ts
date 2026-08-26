'use server';

import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { createCheckoutSession } from '@/lib/payments/stripe';
import type { MembershipTier } from '@ifpc/types';
import type { ActionState } from './auth';

// Prices aligned with lib/payments/stripe.ts (MEMBERSHIP_TIERS).
const PLANS: Record<string, { price: number; months: number }> = {
  PREMIUM: { price: 9900, months: 12 },
  SCOUT: { price: 19900, months: 12 },
  CLUB: { price: 49900, months: 12 },
};

/**
 * Starts the payment of a membership:
 * 1) With STRIPE_SECRET_KEY → creates a Checkout Session and redirects to Stripe.
 * 2) Without Stripe (dev) → simulated local payment.
 */
export async function startCheckoutAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Invalid session.' };
  }
  const tier = (formData.get('tier') as string) ?? '';
  const plan = PLANS[tier];
  if (!plan) {
    return { error: 'Invalid plan.' };
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
    console.error('[membership] error starting checkout:', error);
    return { error: 'Could not start the Stripe payment.' };
  }

  // Development fallback: simulated payment (Stripe not configured).
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
          description: `Membership ${tier} (${plan.months} months, simulated)`,
        },
      }),
    ]);
  } catch {
    return { error: 'Could not activate the plan.' };
  }

  redirect('/dashboard/player/membership');
}
