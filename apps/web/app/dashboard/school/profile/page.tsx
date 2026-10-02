import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { SCHOOL_TYPE_LABELS } from '@/lib/labels';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Organización' };

export default async function SchoolProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const school = await prisma.school.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!school) return null;

  const rows: [string, string][] = [
    ['Nombre', school.name],
    ['Tipo', SCHOOL_TYPE_LABELS[school.type] ?? school.type],
    ['Email', school.user?.email ?? '—'],
    ['Contacto', school.contactName ?? '—'],
    ['Website', school.website ?? '—'],
    ['Country', school.country],
    ['Ciudad', school.city ?? '—'],
    ['Alta en la plataforma', school.createdAt.toLocaleDateString('es')],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Organización"
        subtitle="Datos públicos de tu escuela o servicio comunitario"
        icon="book"
      >
        <Badge variant={school.verified ? 'success' : 'outline'}>
          {school.verified ? 'Verificada' : 'Pendiente de verificación'}
        </Badge>
      </PageHeader>

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
          {school.description ? (
            <div className="mt-3 rounded-md border border-border p-3">
              <dt className="text-xs text-muted-foreground">Description</dt>
              <dd className="mt-1 text-sm">{school.description}</dd>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
