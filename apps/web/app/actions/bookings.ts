'use server';

import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { bookingRequestSchema } from '@ifpc/validation';
import type { ActionState } from './auth';
import { notifyUser } from '@/lib/notifications/notify';
import { revalidatePaths } from '@/lib/revalidate';
import { priceForSession } from '@/lib/bookings';
import { isUnder16 } from '@/lib/minor';

const str = (formData: FormData, key: string): string | null => {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

/**
 * The "1%" Factor · Paso 1: el jugador (o el padre directamente) solicita una
 * sesión. Si el jugador es menor de 16, queda "Awaiting parent"; si no, va
 * directa al especialista.
 */
export async function requestBookingAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Invalid session.' };

  const parsed = bookingRequestSchema.safeParse({
    healthAgentId: str(formData, 'healthAgentId') ?? undefined,
    sessionType: str(formData, 'sessionType') ?? undefined,
    slotId: str(formData, 'slotId') ?? undefined,
    notes: str(formData, 'notes'),
    playerId: str(formData, 'playerId') ?? undefined,
  });
  if (!parsed.success) return { error: 'Check the booking details.' };

  const agent = await prisma.healthAgent.findUnique({ where: { id: parsed.data.healthAgentId } });
  if (!agent || !agent.verified) {
    return { error: 'This specialist is not available for bookings.' };
  }

  const slot = await prisma.availabilitySlot.findUnique({ where: { id: parsed.data.slotId } });
  if (!slot || slot.healthAgentId !== agent.id || slot.startsAt.getTime() < Date.now()) {
    return { error: 'That time is no longer available. Pick another slot.' };
  }
  const taken = await prisma.booking.findFirst({
    where: {
      healthAgentId: agent.id,
      startsAt: slot.startsAt,
      status: { in: ['AWAITING_PARENT', 'AWAITING_SPECIALIST', 'CONFIRMED'] },
    },
    select: { id: true },
  });
  if (taken) return { error: 'That time was just taken. Pick another slot.' };
  const startsAt = slot.startsAt;

  // Jugador objetivo: el propio jugador o un hijo del padre.
  let playerId: string | null = null;
  if (session.user.role === 'PLAYER') {
    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    playerId = player?.id ?? null;
  } else if (session.user.role === 'PARENT' && parsed.data.playerId) {
    const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } });
    if (parent) {
      const link = await prisma.parentChild.findUnique({
        where: { parentId_playerId: { parentId: parent.id, playerId: parsed.data.playerId } },
        select: { playerId: true },
      });
      playerId = link?.playerId ?? null;
    }
  }
  if (!playerId) return { error: 'No player found for this booking.' };

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      userId: true,
      dateOfBirth: true,
      parents: { select: { parent: { select: { id: true, userId: true } } } },
    },
  });
  if (!player) return { error: 'Player not found.' };

  const minor = isUnder16(player.dateOfBirth);
  if (minor && player.parents.length === 0) {
    return { error: 'Link a parent or guardian to book for a player under 16.' };
  }

  const price = priceForSession(agent.priceFrom ?? 0, parsed.data.sessionType);
  const parentLink = player.parents[0]?.parent ?? null;
  const bookedByParent = session.user.role === 'PARENT';
  const status = bookedByParent ? 'AWAITING_SPECIALIST' : minor ? 'AWAITING_PARENT' : 'AWAITING_SPECIALIST';

  try {
    const booking = await prisma.booking.create({
      data: {
        playerId: player.id,
        healthAgentId: agent.id,
        parentId: parentLink?.id ?? null,
        sessionType: parsed.data.sessionType,
        startsAt,
        price,
        currency: agent.currency,
        status,
        notes: parsed.data.notes ?? null,
        requestedByUserId: session.user.id,
        parentApprovedAt: bookedByParent ? new Date() : null,
        paidAt: bookedByParent ? new Date() : null,
      },
    });

    const when = startsAt.toISOString();
    if (booking.status === 'AWAITING_PARENT') {
      for (const link of player.parents) {
        await notifyUser({
          userId: link.parent.userId,
          type: 'application',
          title: 'Approval needed: 1% booking',
          message: `${player.firstName} ${player.lastName} wants to book ${agent.practiceName} (${when}).`,
          link: '/dashboard/parent/bookings',
        });
      }
    } else {
      await notifyUser({
        userId: agent.userId,
        type: 'application',
        title: 'New booking request',
        message: `${player.firstName} ${player.lastName} requested ${agent.practiceName} (${when}).`,
        link: '/dashboard/health-agent/bookings',
      });
      await notifyUser({
        userId: player.userId,
        type: 'application',
        title: 'Booking requested',
        message: `Your request to ${agent.practiceName} was sent.`,
        link: '/dashboard/player/one-percent',
      });
    }
  } catch {
    return { error: 'Could not create the booking.' };
  }

  revalidatePaths(
    '/dashboard/player/one-percent',
    '/dashboard/parent/bookings',
    '/dashboard/health-agent/bookings'
  );
  return {
    success:
      !bookedByParent && status === 'AWAITING_PARENT'
        ? 'Request sent! Your parent will get a notification.'
        : 'Request sent to the specialist.',
  };
}

/** The "1%" Factor · Paso 2: el padre aprueba y paga (pago simulado) la reserva. */
export async function approveBookingAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  const bookingId = str(formData, 'bookingId');
  if (!bookingId) redirect('/dashboard/parent/bookings');

  const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } });
  if (!parent) redirect('/dashboard/parent/bookings');

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      status: 'AWAITING_PARENT',
      player: { parents: { some: { parentId: parent.id } } },
    },
    include: {
      player: { select: { firstName: true, lastName: true, userId: true } },
      healthAgent: { select: { userId: true, practiceName: true } },
    },
  });
  if (!booking) redirect('/dashboard/parent/bookings');

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'AWAITING_SPECIALIST',
      parentId: parent.id,
      parentApprovedAt: new Date(),
      paidAt: new Date(),
    },
  });

  try {
    await notifyUser({
      userId: booking.healthAgent.userId,
      type: 'application',
      title: 'Booking approved & paid',
      message: `${booking.player.firstName} ${booking.player.lastName}: a parent approved and paid a session with ${booking.healthAgent.practiceName}.`,
      link: '/dashboard/health-agent/bookings',
    });
    await notifyUser({
      userId: booking.player.userId,
      type: 'application',
      title: 'Booking approved',
      message: `Your parent approved the booking with ${booking.healthAgent.practiceName}.`,
      link: '/dashboard/player/one-percent',
    });
  } catch {
    // Un fallo del aviso no debe deshacer la aprobación.
  }

  revalidatePaths(
    '/dashboard/parent/bookings',
    '/dashboard/health-agent/bookings',
    '/dashboard/player/one-percent'
  );
  redirect('/dashboard/parent/bookings');
}

export async function declineBookingAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  const bookingId = str(formData, 'bookingId');
  if (!bookingId) redirect('/dashboard/parent/bookings');

  const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } });
  if (!parent) redirect('/dashboard/parent/bookings');

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      status: 'AWAITING_PARENT',
      player: { parents: { some: { parentId: parent.id } } },
    },
    include: {
      player: { select: { firstName: true, userId: true } },
      healthAgent: { select: { userId: true, practiceName: true } },
    },
  });
  if (!booking) redirect('/dashboard/parent/bookings');

  await prisma.booking.update({ where: { id: booking.id }, data: { status: 'DECLINED' } });

  try {
    await notifyUser({
      userId: booking.player.userId,
      type: 'application',
      title: 'Booking declined',
      message: `Your parent declined the booking with ${booking.healthAgent.practiceName}.`,
      link: '/dashboard/player/one-percent',
    });
    await notifyUser({
      userId: booking.healthAgent.userId,
      type: 'application',
      title: 'Booking declined',
      message: `${booking.player.firstName}: the parent declined the booking request.`,
      link: '/dashboard/health-agent/bookings',
    });
  } catch {
    // best-effort
  }

  revalidatePaths('/dashboard/parent/bookings', '/dashboard/health-agent/bookings');
  redirect('/dashboard/parent/bookings');
}

/** The "1%" Factor · Paso 3: el especialista acepta o rechaza la solicitud. */
export async function respondBookingAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  const bookingId = str(formData, 'bookingId');
  const decision = str(formData, 'decision');
  if (!bookingId || (decision !== 'accept' && decision !== 'decline')) {
    redirect('/dashboard/health-agent/bookings');
  }

  const agent = await prisma.healthAgent.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent) redirect('/dashboard/health-agent');

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, healthAgentId: agent.id, status: 'AWAITING_SPECIALIST' },
    include: {
      player: {
        select: {
          firstName: true,
          userId: true,
          parents: { select: { parent: { select: { userId: true } } } },
        },
      },
      healthAgent: { select: { practiceName: true } },
    },
  });
  if (!booking) redirect('/dashboard/health-agent/bookings');

  const accepted = decision === 'accept';
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: accepted ? 'CONFIRMED' : 'DECLINED',
      specialistRespondedAt: new Date(),
    },
  });

  try {
    const targets = [
      booking.player.userId,
      ...booking.player.parents.map((link) => link.parent.userId),
    ];
    for (const userId of targets) {
      await notifyUser({
        userId,
        type: 'application',
        title: accepted ? 'Session confirmed' : 'Session declined',
        message: `${booking.healthAgent.practiceName} ${accepted ? 'confirmed' : 'declined'} the session for ${booking.player.firstName}.`,
        link: '/dashboard/player/one-percent',
      });
    }
  } catch {
    // best-effort
  }

  revalidatePaths(
    '/dashboard/health-agent/bookings',
    '/dashboard/player/one-percent',
    '/dashboard/parent/bookings'
  );
  redirect('/dashboard/health-agent/bookings');
}

/** Deja una reseña (1–5) de una sesión ya celebrada y recalcula la media. */
export async function submitReviewAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Invalid session.' };

  const bookingId = str(formData, 'bookingId');
  const ratingRaw = str(formData, 'rating');
  const comment = str(formData, 'comment');
  if (!bookingId || !ratingRaw) return { error: 'Choose a rating.' };
  const rating = Number(ratingRaw);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'Rating must be between 1 and 5.' };
  }

  let playerIds: string[] = [];
  if (session.user.role === 'PLAYER') {
    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    playerIds = player ? [player.id] : [];
  } else if (session.user.role === 'PARENT') {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      select: { children: { select: { playerId: true } } },
    });
    playerIds = parent?.children.map((child) => child.playerId) ?? [];
  }
  if (playerIds.length === 0) return { error: 'No player found.' };

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      playerId: { in: playerIds },
      status: { in: ['CONFIRMED', 'COMPLETED'] },
      startsAt: { lte: new Date() },
      review: { is: null },
    },
    select: { id: true, playerId: true, healthAgentId: true },
  });
  if (!booking) {
    return { error: 'You can review a session after it has taken place.' };
  }

  try {
    await prisma.specialistReview.create({
      data: {
        healthAgentId: booking.healthAgentId,
        playerId: booking.playerId,
        bookingId: booking.id,
        rating,
        comment: comment ?? null,
      },
    });
    const agg = await prisma.specialistReview.aggregate({
      where: { healthAgentId: booking.healthAgentId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await prisma.healthAgent.update({
      where: { id: booking.healthAgentId },
      data: {
        ratingAvg:
          agg._avg.rating != null ? Math.round(agg._avg.rating * 10) / 10 : null,
        reviewCount: agg._count._all,
      },
    });
  } catch {
    return { error: 'Could not save the review.' };
  }

  revalidatePaths(
    '/dashboard/player/one-percent',
    `/dashboard/player/one-percent/${booking.healthAgentId}`
  );
  return { success: 'Thanks! Your review was saved.' };
}
