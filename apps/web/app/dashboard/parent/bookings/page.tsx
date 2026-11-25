import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { approveBookingAction, declineBookingAction } from '@/app/actions/bookings';
import { BOOKING_SESSION_LABELS, BOOKING_STATUS_LABELS } from '@/lib/bookings';
import { formatPriceFrom } from '@/lib/health-agent';

export const metadata: Metadata = { title: 'Bookings · Parent' };

export default async function ParentBookingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } });
  if (!parent) return null;

  const bookings = await prisma.booking.findMany({
    where: { player: { parents: { some: { parentId: parent.id } } } },
    include: {
      player: { select: { firstName: true, lastName: true } },
      healthAgent: { select: { practiceName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const pending = bookings.filter((booking) => booking.status === 'AWAITING_PARENT');
  const others = bookings.filter((booking) => booking.status !== 'AWAITING_PARENT');

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Bookings"
        subtitle={'Approve and pay session requests from The "1%" Factor.'}
        icon="health"
      />

      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Requests to approve
      </h2>
      {pending.length === 0 ? (
        <Card className="mb-6">
          <CardContent>
            <p className="text-sm text-muted-foreground">No pending requests.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-6 flex flex-col gap-2">
          {pending.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {booking.player.firstName} {booking.player.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {booking.healthAgent.practiceName} · {BOOKING_SESSION_LABELS[booking.sessionType]} ·{' '}
                    {booking.startsAt.toLocaleString('en-GB', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatPriceFrom(booking.price, booking.currency)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={approveBookingAction}>
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-ink transition-transform hover:scale-[1.03]"
                    >
                      Approve &amp; pay
                    </button>
                  </form>
                  <form action={declineBookingAction}>
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
                    >
                      Decline
                    </button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        History
      </h2>
      {others.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No bookings yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {others.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {booking.player.firstName} · {booking.healthAgent.practiceName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {booking.startsAt.toLocaleString('en-GB', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}{' '}
                    · {formatPriceFrom(booking.price, booking.currency)}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                  {BOOKING_STATUS_LABELS[booking.status]}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
