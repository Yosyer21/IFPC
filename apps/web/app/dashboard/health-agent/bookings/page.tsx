import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { respondBookingAction } from '@/app/actions/bookings';
import {
  deleteAvailabilitySlotAction,
  updateClientPlanProgressAction,
} from '@/app/actions/health-agent';
import { AvailabilityForm } from '@/components/health-agent/availability-form';
import { ClientPlanForm } from '@/components/health-agent/client-plan-form';
import { BOOKING_SESSION_LABELS, BOOKING_STATUS_LABELS } from '@/lib/bookings';
import { formatPriceFrom } from '@/lib/health-agent';

export const metadata: Metadata = { title: 'Bookings · Health agent' };

export default async function HealthAgentBookingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.healthAgent.findUnique({ where: { userId: session.user.id } });
  if (!agent) redirect('/dashboard/health-agent/profile/edit');

  const [bookings, plans, slots, clients] = await Promise.all([
    prisma.booking.findMany({
      where: { healthAgentId: agent.id },
      include: { player: { select: { firstName: true, lastName: true } } },
      orderBy: { startsAt: 'asc' },
    }),
    prisma.clientPlan.findMany({
      where: { healthAgentId: agent.id },
      include: { player: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.availabilitySlot.findMany({
      where: { healthAgentId: agent.id, startsAt: { gte: new Date() } },
      orderBy: { startsAt: 'asc' },
      take: 50,
    }),
    prisma.player.findMany({
      where: { bookings: { some: { healthAgentId: agent.id } } },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: 'asc' },
      take: 100,
    }),
  ]);

  const requests = bookings.filter((booking) => booking.status === 'AWAITING_SPECIALIST');
  const upcoming = bookings.filter((booking) => booking.status === 'CONFIRMED');
  const history = bookings.filter(
    (booking) => !['AWAITING_SPECIALIST', 'CONFIRMED'].includes(booking.status)
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Bookings"
        subtitle="Requests approved and paid by parents, your confirmed sessions and active clients."
        icon="calendar"
      />

      <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-3 font-semibold">Availability</h2>
            <AvailabilityForm />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-3 font-semibold">Published slots</h2>
            {slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming slots yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border/60">
                {slots.map((slot) => (
                  <li
                    key={slot.id}
                    className="flex items-center justify-between gap-2 py-2 text-sm"
                  >
                    <span>
                      {slot.startsAt.toLocaleString('en-GB', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}{' '}
                      · {slot.durationMinutes} min
                    </span>
                    <form action={deleteAvailabilitySlotAction}>
                      <input type="hidden" name="slotId" value={slot.id} />
                      <button type="submit" className="text-xs text-destructive hover:underline">
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Requests (parent approved &amp; paid)
      </h2>
      {requests.length === 0 ? (
        <Card className="mb-6">
          <CardContent>
            <p className="text-sm text-muted-foreground">No booking requests right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-6 flex flex-col gap-2">
          {requests.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {booking.player.firstName} {booking.player.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {BOOKING_SESSION_LABELS[booking.sessionType]} ·{' '}
                    {booking.startsAt.toLocaleString('en-GB', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}{' '}
                    · {formatPriceFrom(booking.price, booking.currency)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={respondBookingAction}>
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input type="hidden" name="decision" value="accept" />
                    <button
                      type="submit"
                      className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-ink transition-transform hover:scale-[1.03]"
                    >
                      Accept
                    </button>
                  </form>
                  <form action={respondBookingAction}>
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <input type="hidden" name="decision" value="decline" />
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
        Upcoming sessions
      </h2>
      {upcoming.length === 0 ? (
        <Card className="mb-6">
          <CardContent>
            <p className="text-sm text-muted-foreground">No confirmed sessions yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-6 flex flex-col gap-2">
          {upcoming.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {booking.player.firstName} {booking.player.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {booking.startsAt.toLocaleString('en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Active clients &amp; plans
      </h2>
      <div className="mb-4">
        <Card>
          <CardContent>
            <h2 className="mb-3 font-semibold">Create a client plan</h2>
            <ClientPlanForm
              clients={clients.map((client) => ({
                value: client.id,
                label: `${client.firstName} ${client.lastName}`,
              }))}
            />
          </CardContent>
        </Card>
      </div>
      {plans.length === 0 ? (
        <Card className="mb-6">
          <CardContent>
            <p className="text-sm text-muted-foreground">No client plans yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-6 flex flex-col gap-2">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {plan.player.firstName} {plan.player.lastName}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {plan.currentStep}/{plan.totalSteps} · {plan.progressPct}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.title}</p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${Math.min(100, Math.max(0, plan.progressPct))}%` }}
                  />
                </div>
                <form
                  action={updateClientPlanProgressAction}
                  className="mt-3 flex flex-wrap items-end gap-2"
                >
                  <input type="hidden" name="planId" value={plan.id} />
                  <label className="text-xs">
                    Step
                    <input
                      name="currentStep"
                      type="number"
                      min={1}
                      max={plan.totalSteps}
                      defaultValue={plan.currentStep}
                      className="ml-1 h-8 w-16 rounded-md border border-border bg-background px-2 text-sm"
                    />
                  </label>
                  <label className="text-xs">
                    %
                    <input
                      name="progressPct"
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={plan.progressPct}
                      className="ml-1 h-8 w-16 rounded-md border border-border bg-background px-2 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
                  >
                    Update
                  </button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {history.length > 0 ? (
        <>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            History
          </h2>
          <div className="flex flex-col gap-2">
            {history.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm">
                    {booking.player.firstName} · {BOOKING_SESSION_LABELS[booking.sessionType]}
                  </p>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                    {BOOKING_STATUS_LABELS[booking.status]}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
