import type { ReactNode } from 'react';
import Link from 'next/link';
import { Badge, Card, CardContent } from '@ifpc/ui';
import {
  TRAINING_ORIGIN_LABELS,
  trainingCategoryLabel,
  trainingEquipmentLabel,
  trainingWorkloadLabel,
  type TrainingKind,
  type TrainingOrigin,
} from '@ifpc/config';

export interface TrainingDetailContent {
  id: string;
  title: string;
  category: string;
  kind: TrainingKind;
  ownerType: TrainingOrigin;
  description: string | null;
  content: string | null;
  outcomes: string[];
  videoUrl: string | null;
  durationMinutes: number | null;
  difficulty: number | null;
  /** Ejercicio estructurado (ficha de campo). */
  series: number | null;
  reps: string | null;
  restSeconds: number | null;
  equipment: string[];
  space: string | null;
  players: string | null;
  /** Nombre del autor cuando el contenido es de un coach o un club. */
  authorName: string | null;
}

export interface TrainingContentDetailProps {
  content: TrainingDetailContent;
  backHref: string;
  backLabel: string;
  /** Bloque de acciones propio de cada rol (marcar hecho, quiz, borrar…). */
  actions?: ReactNode;
}

/** Dato de la ficha: solo se pinta si tiene valor. */
function SheetField({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

/**
 * Detalle de un curso o ejercicio del Football Center. Lo comparten el jugador
 * (con su progreso y su quiz) y las áreas del coach y del club (con borrado).
 */
export function TrainingContentDetail({
  content,
  backHref,
  backLabel,
  actions,
}: TrainingContentDetailProps) {
  const origin =
    content.ownerType === 'GENERAL'
      ? TRAINING_ORIGIN_LABELS.GENERAL
      : `${TRAINING_ORIGIN_LABELS[content.ownerType]} · ${content.authorName ?? ''}`.trim();

  // Ficha de campo: solo aparece en ejercicios y solo con algo que contar.
  const workload = trainingWorkloadLabel(content);
  const hasSheet =
    content.kind === 'EXERCISE' &&
    Boolean(workload || content.space || content.players || content.equipment.length > 0);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={backHref}
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← {backLabel}
      </Link>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge>{content.kind === 'COURSE' ? 'Course' : 'Exercise'}</Badge>
        <Badge variant="outline">{trainingCategoryLabel(content.category)}</Badge>
        <span className="text-sm text-muted-foreground">{origin}</span>
        {content.durationMinutes ? (
          <span className="text-sm text-muted-foreground">{content.durationMinutes} min</span>
        ) : null}
        {content.difficulty ? (
          <span className="text-sm text-muted-foreground">Level {content.difficulty}/5</span>
        ) : null}
      </div>

      <h1 className="text-2xl font-bold">{content.title}</h1>
      {content.description ? (
        <p className="mt-2 text-sm text-muted-foreground">{content.description}</p>
      ) : null}

      {content.videoUrl ? (
        <video
          src={content.videoUrl}
          controls
          className="mt-4 aspect-video w-full rounded-lg border border-border bg-black"
        />
      ) : null}

      {hasSheet ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col gap-4">
            <h2 className="font-semibold">Exercise sheet</h2>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <SheetField label="Volume" value={workload} />
              <SheetField
                label="Duration"
                value={content.durationMinutes ? `${content.durationMinutes} min` : null}
              />
              <SheetField label="Space" value={content.space} />
              <SheetField label="Players" value={content.players} />
            </div>
            {content.equipment.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Material</span>
                {content.equipment.map((item) => (
                  <Badge key={item} variant="outline">
                    {trainingEquipmentLabel(item)}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {content.outcomes.length > 0 ? (
        <Card className="mt-6">
          <CardContent>
            <h2 className="mb-2 font-semibold">What you will learn</h2>
            <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              {content.outcomes.map((outcome) => (
                <li key={outcome} className="flex gap-2">
                  <span aria-hidden="true" className="text-emerald-400">
                    •
                  </span>
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {content.content ? (
        <article className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {content.content}
        </article>
      ) : null}

      {actions ? <div className="mt-6 flex flex-col gap-3">{actions}</div> : null}
    </div>
  );
}
