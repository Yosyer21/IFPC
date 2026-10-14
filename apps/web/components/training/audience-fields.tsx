'use client';

import { useState } from 'react';
import { Select } from '@ifpc/ui';
import { TRAINING_SCOPE_OPTIONS } from '@ifpc/config';

export interface AudienceFieldsProps {
  /** Jugadores de la audiencia del autor. */
  players: { playerId: string; name: string }[];
  /** Con quién se abre el formulario (`AUDIENCE` o `SELECTED`). */
  defaultScope: string;
  /** Jugadores ya elegidos (al editar). */
  selectedPlayerIds: string[];
}

/**
 * Destinatarios del contenido o la sesión: a todos los jugadores del autor o solo
 * a los que marque. Las casillas solo aparecen cuando elige «solo algunos» y el
 * servidor comprueba que los marcados sean de su audiencia.
 */
export function AudienceFields({ players, defaultScope, selectedPlayerIds }: AudienceFieldsProps) {
  const [scope, setScope] = useState(defaultScope);

  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-border/70 p-3">
      <legend className="px-1 text-xs font-medium text-muted-foreground">Who is it for</legend>
      <Select
        name="scope"
        label="Recipients"
        options={TRAINING_SCOPE_OPTIONS}
        defaultValue={defaultScope}
        onChange={(event) => setScope(event.target.value)}
      />
      {scope === 'SELECTED' ? (
        players.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            You have no players yet: link a player from My players first.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Players</span>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {players.map((player) => (
                <label
                  key={player.playerId}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <input
                    type="checkbox"
                    name="playerIds"
                    value={player.playerId}
                    defaultChecked={selectedPlayerIds.includes(player.playerId)}
                    className="h-3.5 w-3.5 rounded border-border"
                  />
                  {player.name}
                </label>
              ))}
            </div>
          </div>
        )
      ) : null}
    </fieldset>
  );
}
