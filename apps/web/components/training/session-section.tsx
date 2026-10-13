import { TrainingSessionCard } from '@/components/training/session-card';
import type { TrainingSessionView } from '@/lib/training-sessions';

export interface TrainingSessionSectionProps {
  /** Título de la sección de origen (p. ej. «From your coach»). */
  title: string;
  subtitle?: string;
  sessions: TrainingSessionView[];
}

/**
 * Sesiones de un origen dentro de la pestaña «Weekly plan». Como en el contenido,
 * un origen sin sesiones no pinta nada.
 */
export function TrainingSessionSection({ title, subtitle, sessions }: TrainingSessionSectionProps) {
  if (sessions.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="font-semibold">
          {title}{' '}
          <span className="text-sm font-normal text-muted-foreground">({sessions.length})</span>
        </h2>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="flex flex-col gap-4">
        {sessions.map((session) => (
          <TrainingSessionCard
            key={session.id}
            session={session}
            detailHref={`/dashboard/player/training/sessions/${session.id}`}
            showProgress
          />
        ))}
      </div>
    </section>
  );
}
