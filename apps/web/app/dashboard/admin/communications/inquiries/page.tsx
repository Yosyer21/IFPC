import type { Metadata } from 'next';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { closeInquiryAction } from '@/app/actions/admin';

export const metadata: Metadata = { title: 'Consultas' };

export default async function AdminInquiriesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const inquiries = await prisma.inquiry.findMany({
    include: { club: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold">Consultas</h1>

      {inquiries.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay consultas registradas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {inquiries.map((inquiry) => (
            <Card key={inquiry.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{inquiry.subject ?? 'Consulta'}</p>
                  <p className="text-sm text-muted-foreground">
                    {inquiry.name} · {inquiry.email} → {inquiry.club.name}
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                    {inquiry.message}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={inquiry.status === 'NEW' ? 'warning' : 'success'}>
                    {inquiry.status}
                  </Badge>
                  {inquiry.status !== 'CLOSED' ? (
                    <form action={closeInquiryAction}>
                      <input type="hidden" name="inquiryId" value={inquiry.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                      >
                        Cerrar
                      </button>
                    </form>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
