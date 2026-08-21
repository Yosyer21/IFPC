import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@future-buller/database';
import { Badge } from '@future-buller/ui';
import { OPPORTUNITY_TYPE_LABELS } from '@future-buller/config';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Oportunidades — Future Buller',
  description: 'Pruebas, becas y convocatorias abiertas de clubes y universidades.',
};

export default async function PublicOpportunitiesPage() {
  const opportunities = await prisma.opportunity.findMany({
    where: { status: 'OPEN' },
    include: { club: true, university: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const scholarships = opportunities.filter((o) => o.type === 'SCHOLARSHIP').length;
  const countries = new Set(
    opportunities.map((o) => o.club?.country ?? o.university?.country).filter(Boolean)
  ).size;

  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Opportunities
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Oportunidades abiertas
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {opportunities.length} convocatorias · {scholarships} becas · {countries} países.
            Aplica desde tu perfil de jugador.
          </p>
        </div>

        {opportunities.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
            <p className="text-muted-foreground">
              No hay oportunidades abiertas ahora. Vuelve pronto.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opportunity) => {
              const isScholarship = opportunity.type === 'SCHOLARSHIP';
              return (
                <Link
                  key={opportunity.id}
                  href={`/opportunities/${opportunity.id}`}
                  className={`group rounded-2xl border bg-card p-6 transition-all hover:shadow-lg ${
                    isScholarship
                      ? 'border-emerald-500/40 hover:shadow-emerald-500/10'
                      : 'border-border/60 hover:border-emerald-500/50 hover:shadow-emerald-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={isScholarship ? 'success' : 'outline'}>
                      {(OPPORTUNITY_TYPE_LABELS as Record<string, string | undefined>)[
                        opportunity.type
                      ] ?? opportunity.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {opportunity.location ?? 'Online'}
                    </span>
                  </div>
                  <h2 className="mt-4 font-semibold group-hover:text-emerald-400">
                    {opportunity.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {opportunity.club?.name ?? opportunity.university?.name ?? '—'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {opportunity.position ? (
                      <Badge variant="outline">{opportunity.position}</Badge>
                    ) : null}
                    {opportunity.ageMin || opportunity.ageMax ? (
                      <Badge variant="outline">
                        {opportunity.ageMin ?? '?'}–{opportunity.ageMax ?? '?'} años
                      </Badge>
                    ) : null}
                    {opportunity.closesAt ? (
                      <span className="text-xs text-muted-foreground">
                        Cierra: {opportunity.closesAt.toLocaleDateString('es')}
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}


