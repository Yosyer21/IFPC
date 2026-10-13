import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Club profile' };

export default async function ClubProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!club) notFound();

  const rows: [string, string][] = [
    ['Name', club.name],
    ['Email', club.user?.email ?? '—'],
    ['Country', club.country],
    ['City', club.city ?? '—'],
    ['Liga', club.league ?? '—'],
    ['Member since', club.createdAt.toLocaleDateString('en-GB')],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Club profile"
        subtitle="Your club's public information on the platform"
        icon="briefcase"
      />
      <Badge variant={club.verified ? 'success' : 'warning'}>
        {club.verified ? 'Verified' : 'Pending verification'}
      </Badge>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Information</CardTitle>
        </CardHeader>
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
      {club.description ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{club.description}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
