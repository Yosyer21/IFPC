import Link from 'next/link';
import { Badge, Card, CardContent } from '@future-buller/ui';
import { PLAYER_STATUS_LABELS } from '@future-buller/config';
import { verifyPlayerAction } from '@/app/actions/admin';
import { statusVariant } from './status-badge';

export interface PlayerRowData {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  position?: string | null;
  user: { email: string | null };
}

export function PlayerRow({ player }: { player: PlayerRowData }) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">
            {player.firstName} {player.lastName}
          </p>
          <p className="text-sm text-muted-foreground">{player.user.email}</p>
          {player.position ? (
            <p className="text-xs text-muted-foreground">{player.position}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant(player.status)}>
            {(PLAYER_STATUS_LABELS as Record<string, string | undefined>)[player.status] ??
              player.status}
          </Badge>
          <form action={verifyPlayerAction}>
            <input type="hidden" name="playerId" value={player.id} />
            <select
              name="status"
              defaultValue={player.status}
              className="h-8 rounded-md border border-border bg-background px-2 text-sm"
            >
              <option value="PENDING_VERIFICATION">Pendiente</option>
              <option value="ACTIVE">Activo</option>
              <option value="AVAILABLE">Disponible</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
            <button
              type="submit"
              className="ml-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Actualizar
            </button>
          </form>
          <Link
            href={`/dashboard/admin/players/${player.id}`}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Perfil
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
