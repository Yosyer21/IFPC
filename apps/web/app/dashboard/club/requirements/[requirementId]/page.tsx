import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { closeRequirementAction } from '@/app/actions/club';

export const metadata: Metadata = { title: 'Requisito' };

export default async function ClubRequirementDetailPage({
  params,
}: {
  params: Promise<{ requirementId: string }>;
}) {
  const { requirementId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
  if (!club) notFound();

  const requirement = await prisma.requirement.findFirst({
    where: { id: requirementId, clubId: club.id },
  });
  if (!requirement) notFound();

  const rows: [string, string][] = [
    ['Position', requirement.position ?? 'Any position'],
    [
      'Rango de edad',
      requirement.ageMin || requirement.ageMax
        ? `${requirement.ageMin ?? '?'}–${requirement.ageMax ?? '?'} years old`
        : '—',
    ],
    ['Nivel', requirement.level ?? '—'],
    ['Estado', requirement.status],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/club/requirements"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Requirements
      </Link>
      <h1 className="mb-4 text-2xl font-bold">{requirement.title}</h1>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label} className="rounded-md border border-border p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {requirement.description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {requirement.description}
            </p>
          ) : null}

          {requirement.status === 'OPEN' ? (
            <form action={closeRequirementAction}>
              <input type="hidden" name="requirementId" value={requirement.id} />
              <button
                type="submit"
                className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
              >
                Marcar como cubierto
              </button>
            </form>
          ) : (
            <Badge variant="default">Cerrado</Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
