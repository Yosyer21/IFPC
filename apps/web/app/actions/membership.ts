'use server';

import { redirect } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import type { MembershipTier } from '@future-buller/types';
import type { ActionState } from './auth';

const PLANS: Record<string, { price: number; months: number }> = {
  PREMIUM: { price: 5999, months: 12 },
  SCOUT: { price: 14999, months: 12 },
  CLUB: { price: 29999, months: 12 },
};

export async function upgradeMembershipAction(
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
          description: `Membresía ${tier} (${plan.months} meses)`,
        },
      }),
    ]);
  } catch {
    return { error: 'No se pudo activar el plan.' };
  }

  redirect('/dashboard/player/membership');
}
