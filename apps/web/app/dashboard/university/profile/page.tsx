import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Mi universidad' };

export default async function UniversityProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const university = await prisma.university.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!university) return null;

  const rows: [string, string][] = [
    ['Nombre', university.name],
    ['Email', university.user?.email ?? '—'],
    ['Country', university.country],
    ['Ciudad', university.city ?? '—'],
    ['Miembro desde', university.createdAt.toLocaleDateString('es')],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Mi universidad"
        subtitle="Your institution's public information on the platform"
        icon="book"
      />

      <Card className="animate-fade-up">
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label} className="rounded-md border border-border p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
