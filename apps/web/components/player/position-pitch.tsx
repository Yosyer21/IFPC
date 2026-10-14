import type { ComponentType } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@ifpc/ui';
import { pitchSpot, zoneGlow, type PitchGroup, type PitchSpot } from '@/lib/player-pitch';
import { IconLayers, IconRoute, IconShield, IconTarget } from '@/components/dashboard/icons';

/** Icono del marcador según la familia de la posición. */
const GROUP_ICONS: Record<PitchGroup, ComponentType<{ className?: string }>> = {
  Goalkeeper: IconShield,
  Defence: IconLayers,
  Midfield: IconRoute,
  Attack: IconTarget,
};

/** Nombre humano de cada familia. */
const GROUP_LABELS: Record<PitchGroup, string> = {
  Goalkeeper: 'Goalkeeper',
  Defence: 'Defence',
  Midfield: 'Midfield',
  Attack: 'Attack',
};

/** Dibujo de la cancha: capas animadas (césped, barrido), líneas y halo/marcador. */
function PitchBoard({ spot }: { spot: PitchSpot | null }) {
  return (
    <div className="relative aspect-[3/4] w-full max-w-[240px] shrink-0 overflow-hidden rounded-2xl border border-border bg-panel">
      {/* Césped a franjas, moviéndose muy despacio. */}
      <div
        aria-hidden="true"
        className="pitch-grass absolute -inset-y-24 inset-x-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.035) 0 12.5%, transparent 12.5% 25%)',
          backgroundSize: '100% 84px',
        }}
      />
      {/* Halo ambiental lima + barrido de luz que cruza el campo. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(70% 45% at 50% 55%, rgba(196, 247, 71, 0.10), transparent 70%)',
        }}
      />
      <div aria-hidden="true" className="pitch-sweep absolute inset-0" />

      {/* El campo: la geometría de `player-pitch` es relativa a este rectángulo. */}
      <div className="absolute inset-[5%]">
        <div className="pitch-lines absolute inset-0">
          <div aria-hidden="true" className="absolute left-0 top-1/2 h-px w-full bg-white/12" />
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 aspect-square w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12"
          />
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25"
          />

          {/* Área propia (abajo, arco defendido) */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-[18%] h-[16%] w-[64%] border-x border-t border-white/12"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-[32%] h-[7%] w-[36%] border-x border-t border-white/12"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-[4%] left-[41%] h-[4%] w-[18%] rounded-b border border-white/12"
          />

          {/* Área rival (arriba: dirección de ataque) */}
          <div
            aria-hidden="true"
            className="absolute left-[18%] top-0 h-[16%] w-[64%] border-x border-b border-white/12"
          />
          <div
            aria-hidden="true"
            className="absolute left-[32%] top-0 h-[7%] w-[36%] border-x border-b border-white/12"
          />
          <div
            aria-hidden="true"
            className="absolute -top-[4%] left-[41%] h-[4%] w-[18%] rounded-t border border-white/12"
          />
        </div>

        {spot ? (
          <>
            {/* La zona se marca con un halo lima que respira: sin recuadros. */}
            {spot.zones.map((zone, index) => {
              const glow = zoneGlow(zone);
              return (
                <span
                  key={`${zone.x}-${zone.y}`}
                  aria-hidden="true"
                  className="pitch-glow absolute aspect-square"
                  style={{
                    left: `${glow.x}%`,
                    top: `${glow.y}%`,
                    width: `${glow.size}%`,
                    animationDelay: `${index * 90}ms`,
                  }}
                >
                  <span
                    className="pitch-glow-pulse absolute inset-0 block rounded-full"
                    style={{ animationDelay: `${index * 0.5}s` }}
                  />
                </span>
              );
            })}

            {spot.markers.map((marker, index) => {
              const MarkerIcon = GROUP_ICONS[spot.group];
              return (
                <span
                  key={`${marker.x}-${marker.y}`}
                  className="pitch-marker absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${marker.x}%`,
                    top: `${marker.y}%`,
                    animationDelay: `${350 + index * 120}ms`,
                  }}
                >
                  <span
                    className="pitch-float relative flex h-11 w-11 items-center justify-center"
                    style={{ animationDelay: `${index * 0.6}s` }}
                  >
                    {/* Dos ondas desfasadas que laten alrededor del punto. */}
                    <span
                      aria-hidden="true"
                      className="pitch-ripple absolute inset-1 rounded-full border border-brand/70"
                      style={{ animationDelay: `${index * 0.4}s` }}
                    />
                    <span
                      aria-hidden="true"
                      className="pitch-ripple pitch-ripple-slow absolute inset-1 rounded-full border border-brand/50"
                    />
                    {/* Arco lima girando pegado al borde. */}
                    <span aria-hidden="true" className="pitch-ring absolute inset-0 rounded-full" />
                    <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-brand/40 bg-ink shadow-[0_0_20px_rgba(196,247,71,0.55)]">
                      <MarkerIcon className="h-4 w-4 text-brand" />
                    </span>
                  </span>
                </span>
              );
            })}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="pitch-empty rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand/80">
              No position
            </span>
          </div>
        )}
      </div>

      <span className="absolute bottom-2 right-2 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        Attacking ↑
      </span>
    </div>
  );
}

/**
 * «Position on the pitch»: muestra gráficamente la posición del jugador (y su
 * familia) sobre la cancha. Sin posición todavía, explica cómo ponerla.
 */
export function PositionPitch({
  position,
  footLabel,
  competitionLabel,
}: {
  position: string | null;
  footLabel?: string | null;
  competitionLabel?: string | null;
}) {
  const spot = pitchSpot(position);
  const Icon = spot ? GROUP_ICONS[spot.group] : IconTarget;

  return (
    <Card className="animate-fade-up" style={{ animationDelay: '80ms' }}>
      <CardContent className="flex flex-col gap-5 sm:flex-row">
        <PitchBoard spot={spot} />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div>
            <h2 className="font-semibold">Position on the pitch</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {spot
                ? 'This is where you play: the shaded area is the zone you cover.'
                : 'You have not set your position yet. Choose it and it will show here.'}
            </p>
          </div>

          {spot ? (
            <>
              <div className="flex items-center gap-3">
                <span className="chip-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{spot.label}</p>
                  <p className="text-xs text-muted-foreground">{GROUP_LABELS[spot.group]}</p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border p-3">
                  <dt className="text-xs text-muted-foreground">Preferred foot</dt>
                  <dd className="mt-1 font-medium">{footLabel ?? '—'}</dd>
                </div>
                <div className="rounded-md border border-border p-3">
                  <dt className="text-xs text-muted-foreground">Competition</dt>
                  <dd className="mt-1 font-medium">{competitionLabel ?? '—'}</dd>
                </div>
              </dl>

              {spot.wide ? (
                <p className="text-xs text-muted-foreground">
                  Wide role: your profile does not say which flank, so both are shown.
                </p>
              ) : null}
            </>
          ) : null}

          <Link
            href="/dashboard/player/profile/edit"
            className="text-sm font-medium text-brand transition-colors hover:underline"
          >
            {spot ? 'Change my position →' : 'Set my position →'}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
