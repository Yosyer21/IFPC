import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@future-buller/auth';
import { prisma } from '@future-buller/database';
import { Card, CardContent } from '@future-buller/ui';

export const metadata: Metadata = { title: 'Datos físicos' };

export default async function PlayerPhysicalPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) notFound();

  const age = player.dateOfBirth
    ? Math.floor((Date.now() - player.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const rows: [string, string][] = [
    ['Edad', age !== null ? `${age} años` : '—'],
    ['Fecha de nacimiento', player.dateOfBirth ? player.dateOfBirth.toLocaleDateString('es') : '—'],
    ['Altura', player.heightCm ? `${player.heightCm} cm` : '—'],
    ['Peso', player.weightKg ? `${player.weightKg} kg` : '—'],
    ['Nacionalidad', player.nationality ?? '—'],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Datos físicos</h1>
        <Link
          href="/dashboard/player/profile/edit"
          className="text-sm text-muted-foreground hover:underline"
        >
          Editar
        </Link>
      </div>
      <Card>
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
