import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@ifpc/database';
import { auth } from '@ifpc/auth';
import { Badge } from '@ifpc/ui';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { registerForCampAction } from '@/app/actions/player';

export const metadata: Metadata = { title: 'Camp — IFPC' };

export default async function PublicCampDetailPage({
  params,
}: {
  params: Promise<{ campId: string }>;
}) {
  const { campId } = await params;

  const camp = await prisma.camp.findUnique({
    where: { id: campId },
    include: {
      coach: { include: { user: true } },
      club: true,
      registrations: true,
    },
  });
  if (!camp || camp.status === 'DRAFT' || camp.status === 'CANCELLED') notFound();

  const session = await auth();
  const player = session?.user?.id
    ? await prisma.player.findUnique({ where: { userId: session.user.id } })
    : null;
  const alreadyRegistered = player
    ? camp.registrations.some((r) => r.playerId === player.id)
    : false;

  const spotsLeft = camp.capacity ? Math.max(0, camp.capacity - camp.registrations.length) : null;

  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 py-16">
        <Link href="/camps" className="text-sm text-muted-foreground hover:text-emerald-400">
          ← Camps
        </Link>

        <div className="mt-6 rounded-2xl border border-border/60 bg-card p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline">{camp.status === 'FULL' ? 'Completo' : 'Abierto'}</Badge>
            <span className="text-sm text-muted-foreground">
              {camp.startsAt.toLocaleDateString('es')}
              {camp.endsAt ? ` → ${camp.endsAt.toLocaleDateString('es')}` : ''}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight">{camp.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {camp.city ?? '—'}
            {camp.country ? `, ${camp.country}` : ''}
          </p>

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            {camp.description ?? 'Sin descripción.'}
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 p-4">
              <div className="text-xs text-muted-foreground">Precio</div>
              <div className="mt-1 text-lg font-semibold text-emerald-400">
                {camp.price
                  ? (camp.price / 100).toLocaleString('es-ES', {
                      style: 'currency',
                      currency: camp.currency.toUpperCase(),
                    })
                  : 'Gratuito'}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 p-4">
              <div className="text-xs text-muted-foreground">Plazas</div>
              <div className="mt-1 text-lg font-semibold">
                {camp.capacity ? `${spotsLeft ?? 0} de ${camp.capacity}` : 'Sin límite'}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 p-4">
              <div className="text-xs text-muted-foreground">Organiza</div>
              <div className="mt-1 text-sm font-semibold">
                {camp.club?.name ?? camp.coach?.user?.name ?? 'IFPC'}
              </div>
            </div>
          </div>

          {alreadyRegistered ? (
            <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
              Ya estás inscrito en este camp. El club te contactará con los detalles.
            </div>
          ) : (
            <form action={registerForCampAction} className="mt-8">
              <input type="hidden" name="campId" value={camp.id} />
              <button
                type="submit"
                disabled={camp.status === 'FULL' || (spotsLeft !== null && spotsLeft <= 0)}
                className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {camp.status === 'FULL' || (spotsLeft !== null && spotsLeft <= 0)
                  ? 'Completo'
                  : 'Solicitar plaza'}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}


