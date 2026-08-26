import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Miembros del club' };

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Propietario',
  MANAGER: 'Manager',
  COACH: 'Entrenador',
  SCOUT: 'Ojeador',
  STAFF: 'Staff',
};

export default async function ClubStaffPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
  if (!club) notFound();

  const staff = await prisma.clubStaff.findMany({
    where: { clubId: club.id },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Miembros del club" icon="users">
        <Link
          href="/dashboard/club/staff/invite"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-600"
        >
          Invitar miembro
        </Link>
      </PageHeader>

      {staff.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No staff members registered yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {staff.map((member) => (
            <Card key={member.id}>
              <CardContent className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{member.user.name}</h2>
                  <p className="text-sm text-muted-foreground">{member.user.email}</p>
                </div>
                <Badge>{ROLE_LABELS[member.role] ?? member.role}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
