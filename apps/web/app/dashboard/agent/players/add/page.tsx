import type { Metadata } from 'next';
import Link from 'next/link';
import { AddPlayerForm } from '@/components/agent/add-player-form';

export const metadata: Metadata = { title: 'Añadir jugador' };

export default function AgentAddPlayerPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/agent/players"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Mis jugadores
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Añadir jugador</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Introduce el email de la cuenta del jugador que quieres representar.
      </p>
      <AddPlayerForm />
    </div>
  );
}
