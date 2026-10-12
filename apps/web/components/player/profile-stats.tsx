import { Card, CardContent } from '@ifpc/ui';
import { CategoryBars } from '@/components/player/charts';
import type { PlayerStats } from '@/lib/player-stats';

export interface ProfileStatsCardProps {
  stats: PlayerStats;
  /** Título del panel (por defecto, «Estadísticas»). */
  title?: string;
  className?: string;
}

/**
 * Panel frontal de estadísticas del jugador: nivel global, totales de carrera y
 * nivel por categoría. Lo comparten el perfil propio, el muro de Discovery y el
 * perfil público.
 */
export function ProfileStatsCard({
  stats,
  title = 'Estadísticas',
  className,
}: ProfileStatsCardProps) {
  const kpis = [
    { label: 'Partidos', value: stats.career.appearances },
    { label: 'Goles', value: stats.career.goals },
    { label: 'Asistencias', value: stats.career.assists },
    { label: 'Temporadas', value: stats.career.seasons },
    { label: 'Vídeos', value: stats.videos },
    { label: 'Evaluaciones', value: stats.evaluations },
  ];
  const hasData =
    stats.overall !== null || stats.career.entries > 0 || stats.videos > 0 || stats.evaluations > 0;

  return (
    <Card className={`animate-fade-up ${className ?? ''}`}>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">{title}</h2>
          {stats.overall !== null ? (
            <p className="text-sm text-muted-foreground">
              Nivel global{' '}
              <strong className="text-lg font-bold tabular-nums text-foreground">
                {stats.overall}
              </strong>
              <span className="text-xs">/10</span>
            </p>
          ) : null}
        </div>

        {hasData ? (
          <>
            <dl className="grid grid-cols-3 gap-2">
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-lg border border-border/60 px-2 py-2 text-center"
                >
                  <dd className="text-xl font-bold tabular-nums">{kpi.value}</dd>
                  <dt className="mt-0.5 text-[11px] text-muted-foreground">{kpi.label}</dt>
                </div>
              ))}
            </dl>

            {stats.categories.length > 0 ? (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Nivel por categoría
                </h3>
                <CategoryBars
                  items={stats.categories.map((entry) => ({
                    label: entry.label,
                    value: entry.average,
                  }))}
                />
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Todavía no hay estadísticas: aparecerán con las evaluaciones, la trayectoria y los
            vídeos.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
