import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@ifpc/database';
import { Badge } from '@ifpc/ui';
import { OPPORTUNITY_TYPE_LABELS } from '@ifpc/config';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = { title: 'Club — IFPC' };

export default async function PublicClubDetailPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      opportunities: {
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      requirements: { where: { status: 'OPEN' }, take: 10 },
    },
  });
  if (!club || !club.verified) notFound();

  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 py-16">
        <Link href="/clubs" className="text-sm text-muted-foreground hover:text-emerald-400">
          ← Clubes
        </Link>

        <div className="mt-6 rounded-2xl border border-border/60 bg-card p-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-xl font-bold text-emerald-400">
              {club.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">{club.name}</h1>
              <p className="text-sm text-muted-foreground">
                {club.city ? `${club.city}, ` : ''}
                {club.country}
              </p>
            </div>
            <Badge variant="success" className="ml-auto">
              Verificado
            </Badge>
          </div>

          {club.description ? (
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{club.description}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            {club.league ? <Badge variant="outline">{club.league}</Badge> : null}
            <Badge variant="outline">{club.opportunities.length} oportunidades abiertas</Badge>
            <Badge variant="outline">{club.requirements.length} requisitos abiertos</Badge>
          </div>
        </div>

        <h2 className="mb-4 mt-10 text-xl font-semibold">Oportunidades abiertas</h2>
        {club.opportunities.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
            Este club no tiene oportunidades abiertas ahora.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {club.opportunities.map((opportunity) => (
              <Link
                key={opportunity.id}
                href={`/opportunities/${opportunity.id}`}
                className="group rounded-2xl border border-border/60 bg-card p-6 transition-colors hover:border-emerald-500/50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold group-hover:text-emerald-400">
                    {opportunity.title}
                  </h3>
                  <Badge variant="outline">
                    {(OPPORTUNITY_TYPE_LABELS as Record<string, string | undefined>)[
                      opportunity.type
                    ] ?? opportunity.type}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {opportunity.position ? `Posición: ${opportunity.position} · ` : ''}
                  {opportunity.location ?? 'Ubicación por definir'}
                  {opportunity.closesAt
                    ? ` · Cierra: ${opportunity.closesAt.toLocaleDateString('es')}`
                    : ''}
                </p>
              </Link>
            ))}
          </div>
        )}

        <h2 className="mb-4 mt-10 text-xl font-semibold">Perfiles buscados</h2>
        {club.requirements.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
            No hay perfiles buscados publicados.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {club.requirements.map((requirement) => (
              <div
                key={requirement.id}
                className="rounded-2xl border border-border/60 bg-card p-5"
              >
                <h3 className="font-medium">{requirement.title}</h3>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {requirement.position ? (
                    <Badge variant="outline">{requirement.position}</Badge>
                  ) : null}
                  {requirement.ageMin || requirement.ageMax ? (
                    <Badge variant="outline">
                      {requirement.ageMin ?? '?'}–{requirement.ageMax ?? '?'} años
                    </Badge>
                  ) : null}
                  {requirement.country ? (
                    <Badge variant="outline">{requirement.country}</Badge>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}


