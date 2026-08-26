import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@ifpc/database';
import { Badge } from '@ifpc/ui';
import { OPPORTUNITY_TYPE_LABELS } from '@ifpc/config';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = { title: 'Oportunidad — IFPC' };

export default async function PublicOpportunityDetailPage({
  params,
}: {
  params: Promise<{ opportunityId: string }>;
}) {
  const { opportunityId } = await params;

  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: { club: true, university: true },
  });
  if (!opportunity || opportunity.status !== 'OPEN') notFound();

  const creator =
    opportunity.creatorType === 'UNIVERSITY'
      ? opportunity.university?.name
      : opportunity.club?.name;
  const creatorHref =
    opportunity.creatorType === 'UNIVERSITY'
      ? null
      : opportunity.clubId
        ? `/clubs/${opportunity.clubId}`
        : null;
  const typeLabel =
    (OPPORTUNITY_TYPE_LABELS as Record<string, string | undefined>)[opportunity.type] ??
    opportunity.type;

  return (
    <div className="min-h-screen bg-[#0a0e0c] text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 py-16">
        <Link
          href="/opportunities"
          className="text-sm text-muted-foreground hover:text-emerald-400"
        >
          ← Oportunidades
        </Link>

        <div className="mt-6 rounded-2xl border border-border/60 bg-card p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={opportunity.type === 'SCHOLARSHIP' ? 'success' : 'outline'}>
              {typeLabel}
            </Badge>
            <Badge variant="success">Abierta</Badge>
            {opportunity.closesAt ? (
              <span className="text-sm text-muted-foreground">
                Cierra el {opportunity.closesAt.toLocaleDateString('es')}
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight">{opportunity.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {creatorHref ? (
              <Link href={creatorHref} className="hover:text-emerald-400">
                {creator}
              </Link>
            ) : (
              creator
            )}
          </p>

          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {opportunity.position ? (
              <Badge variant="outline">Position: {opportunity.position}</Badge>
            ) : null}
            {opportunity.ageMin || opportunity.ageMax ? (
              <Badge variant="outline">
                Edad: {opportunity.ageMin ?? '?'}–{opportunity.ageMax ?? '?'}
              </Badge>
            ) : null}
            {opportunity.location ? (
              <Badge variant="outline">Location: {opportunity.location}</Badge>
            ) : null}
          </div>

          {opportunity.description ? (
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              {opportunity.description}
            </p>
          ) : null}

          <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
            <p className="text-sm text-muted-foreground">
              Do you fit this profile? Send your application from your player account.
            </p>
            <Link
              href="/register"
              className="mt-4 inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
            >
              Crear cuenta y aplicar
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


