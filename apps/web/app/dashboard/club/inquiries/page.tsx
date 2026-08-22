import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Consultas' };

export default async function ClubInquiriesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
  if (!club) notFound();

  const inquiries = await prisma.inquiry.findMany({
    where: { clubId: club.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Consultas recibidas"
        subtitle="Mensajes de jugadores y familias interesados en tu club"
        icon="mail"
      />

      {inquiries.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No has recibido consultas todavía.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {inquiries.map((inquiry) => (
            <Link
              key={inquiry.id}
              href={`/dashboard/club/inquiries/${inquiry.id}`}
              className="group"
            >
              <Card className="transition-colors group-hover:border-primary">
                <CardContent className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">{inquiry.subject ?? 'Consulta'}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {inquiry.name} · {inquiry.email}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {inquiry.createdAt.toLocaleDateString('es')}
                    </p>
                  </div>
                  <Badge variant={inquiry.status === 'NEW' ? 'warning' : 'success'}>
                    {inquiry.status}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
