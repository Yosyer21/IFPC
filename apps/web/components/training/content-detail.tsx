import type { ReactNode } from 'react';
import Link from 'next/link';
import { Badge, Card, CardContent } from '@ifpc/ui';
import {
  TRAINING_ORIGIN_LABELS,
  trainingCategoryLabel,
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
