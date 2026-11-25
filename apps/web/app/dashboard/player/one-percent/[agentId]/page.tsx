import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { BookingRequestForm } from '@/components/player/booking-request-form';
import { ReviewForm } from '@/components/player/review-form';
import {
  HEALTH_AGENT_FORMAT_LABELS,
  HEALTH_AGENT_SPECIALTY_LABELS,
  formatPriceFrom,
  healthAgentLocation,
} from '@/lib/health-agent';
import { BOOKING_STATUS_LABELS } from '@/lib/bookings';

export const metadata: Metadata = { title: 'Specialist · The "1%" Factor' };

export default async function SpecialistPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.healthAgent.findUnique({ where: { id: agentId } });
  if (!agent || !agent.verified) notFound();

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const bookings = player
    ? await prisma.booking.findMany({
        where: {
          playerId: player.id,
          healthAgentId: agent.id,
          status: { in: ['AWAITING_PARENT', 'AWAITING_SPECIALIST', 'CONFIRMED', 'COMPLETED'] },
        },
        include: { review: { select: { id: true } } },
        orderBy: { startsAt: 'asc' },
      })
    : [];

  const now = new Date();
  // Slots publicados por el especialista que aún no tienen una reserva activa.
  const slotRows = await prisma.availabilitySlot.findMany({
    where: { healthAgentId: agent.id, startsAt: { gte: now } },
    orderBy: { startsAt: 'asc' },
    take: 40,
  });
  const taken = slotRows.length
    ? await prisma.booking.findMany({
        where: {
          healthAgentId: agent.id,
          startsAt: { in: slotRows.map((slot) => slot.startsAt) },
          status: { in: ['AWAITING_PARENT', 'AWAITING_SPECIALIST', 'CONFIRMED'] },
        },
        select: { startsAt: true },
      })
    : [];
  const takenSet = new Set(taken.map((row) => row.startsAt.getTime()));
  const slots = slotRows
    .filter((slot) => !takenSet.has(slot.startsAt.getTime()))
    .map((slot) => ({
      id: slot.id,
      label: slot.startsAt.toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    }));

  const reviews = await prisma.specialistReview.findMany({
    where: { healthAgentId: agent.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { player: { select: { firstName: true } } },
  });
  const reviewable = bookings.filter(
    (booking) =>
      ['CONFIRMED', 'COMPLETED'].includes(booking.status) &&
      booking.startsAt <= now &&
      !booking.review
  );

  const location = healthAgentLocation(agent);
  const price = formatPriceFrom(agent.priceFrom, agent.currency);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard/player/one-percent"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← The &quot;1%&quot; Factor
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardContent>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{agent.practiceName}</h1>
                  {agent.headline ? (
                    <p className="text-sm text-muted-foreground">{agent.headline}</p>
                  ) : null}
                </div>
                <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-[#4f6b0a]">
                  Verified
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {agent.specialties.map((value) => (
                  <span key={value} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                    {HEALTH_AGENT_SPECIALTY_LABELS[value] ?? value}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                {location ? <span>{location}</span> : null}
                <span>{HEALTH_AGENT_FORMAT_LABELS[agent.format] ?? agent.format}</span>
                {price ? <span>From {price}</span> : null}
                {agent.ratingAvg != null ? (
                  <span>
                    {agent.ratingAvg.toFixed(1)} ★ ({agent.reviewCount})
                  </span>
                ) : null}
              </div>
              {agent.about ? (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{agent.about}</p>
              ) : null}
              {agent.services.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {agent.services.map((service) => (
                    <span
                      key={service}
                      className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {bookings.length > 0 ? (
            <Card>
              <CardContent>
                <h2 className="mb-3 font-semibold">Your sessions with this specialist</h2>
                <ul className="flex flex-col divide-y divide-border/60">
                  {bookings.map((booking) => (
                    <li
                      key={booking.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                    >
                      <span>
                        {booking.startsAt.toLocaleString('en-GB', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                      <span className="text-muted-foreground">
                        {formatPriceFrom(booking.price, booking.currency)}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {BOOKING_STATUS_LABELS[booking.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {reviewable.length > 0 ? (
            <Card>
              <CardContent>
                <h2 className="mb-3 font-semibold">Rate your session</h2>
                <div className="flex flex-col gap-4">
                  {reviewable.map((booking) => (
                    <div key={booking.id}>
                      <p className="text-sm text-muted-foreground">
                        {booking.startsAt.toLocaleDateString('en-GB')} ·{' '}
                        {BOOKING_STATUS_LABELS[booking.status]}
                      </p>
                      <ReviewForm bookingId={booking.id} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent>
              <h2 className="mb-3 font-semibold">Reviews</h2>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border/60">
                  {reviews.map((review) => (
                    <li key={review.id} className="py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{review.player.firstName}</span>
                        <span>{review.rating} ★</span>
                      </div>
                      {review.comment ? (
                        <p className="mt-1 text-muted-foreground">{review.comment}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardContent>
            <h2 className="mb-3 font-semibold">Book a session</h2>
            <BookingRequestForm
              healthAgentId={agent.id}
              fullPrice={agent.priceFrom ?? 0}
              slots={slots}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
