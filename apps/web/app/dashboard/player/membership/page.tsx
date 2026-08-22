import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { MembershipUpgradeForm } from '@/components/player/membership-upgrade-form';
import { PageHeader } from '@/components/player/page-header';

export const metadata: Metadata = { title: 'Membresía' };

export default async function PlayerMembershipPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [player, membership] = await Promise.all([
    prisma.player.findUnique({ where: { userId: session.user.id } }),
    prisma.membership.findUnique({ where: { userId: session.user.id } }),
  ]);
  if (!player) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Membresía"
        subtitle="Elige el plan que mejor se adapte a tu etapa como jugador"
        icon="star"
      />

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Tu plan actual</h2>
            <p className="text-sm text-muted-foreground">
              {membership?.tier ?? 'FREE'}
              {membership?.endsAt
                ? ` · Vigente hasta ${membership.endsAt.toLocaleDateString('es')}`
                : ''}
            </p>
          </div>
          <Badge variant={membership?.tier && membership.tier !== 'FREE' ? 'success' : 'default'}>
            {membership?.tier ?? 'FREE'}
          </Badge>
        </CardContent>
      </Card>

      <h2 className="mb-4 text-lg font-semibold">Planes disponibles</h2>
      <MembershipUpgradeForm currentTier={membership?.tier ?? 'FREE'} />

      <div className="mt-6">
        <Link
          href="/dashboard/player/settings"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Ajustes
        </Link>
      </div>
    </div>
  );
}
