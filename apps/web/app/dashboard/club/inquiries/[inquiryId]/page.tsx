import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { RespondInquiryForm } from '@/components/club/respond-inquiry-form';

export const metadata: Metadata = { title: 'Consulta' };

export default async function ClubInquiryDetailPage({
  params,
}: {
  params: Promise<{ inquiryId: string }>;
}) {
  const { inquiryId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const club = await prisma.club.findUnique({ where: { userId: session.user.id } });
  if (!club) notFound();

  const inquiry = await prisma.inquiry.findFirst({
    where: { id: inquiryId, clubId: club.id },
  });
  if (!inquiry) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/club/inquiries"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Consultas
      </Link>
      <h1 className="mb-4 text-2xl font-bold">{inquiry.subject ?? 'Consulta'}</h1>

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {inquiry.name} · {inquiry.email}
            </p>
            <Badge variant={inquiry.status === 'NEW' ? 'warning' : 'success'}>
              {inquiry.status}
            </Badge>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{inquiry.message}</p>
        </CardContent>
      </Card>

      {inquiry.response ? (
        <Card className="mb-4 border-emerald-600/30">
          <CardContent className="flex flex-col gap-2">
            <Badge variant="success">Respondida el {inquiry.respondedAt?.toLocaleDateString('es')}</Badge>
            <p className="text-sm text-muted-foreground">{inquiry.response}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <h2 className="mb-4 font-semibold">Responder consulta</h2>
            <RespondInquiryForm inquiryId={inquiry.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
