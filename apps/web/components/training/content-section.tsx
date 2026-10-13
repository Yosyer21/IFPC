import { TrainingContentGrid } from '@/components/training/content-grid';
import type { TrainingItem } from '@/lib/training';

export interface TrainingSectionProps {
  /** Título de la sección de origen (p. ej. «General» o «From your coach»). */
  title: string;
  /** Explicación corta de qué contiene la sección. */
  subtitle?: string;
  items: TrainingItem[];
  basePath?: string;
}

/**
 * Bloque de contenido agrupado por origen dentro de una pestaña del Football
 * Center. Si el origen no tiene nada, no se pinta (las secciones vacías de un
 * coach que no ha publicado no deben aparecer).
 */
export function TrainingSection({ title, subtitle, items, basePath }: TrainingSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="font-semibold">
          {title}{' '}
          <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
        </h2>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      <TrainingContentGrid items={items} basePath={basePath} />
    </section>
  );
}
